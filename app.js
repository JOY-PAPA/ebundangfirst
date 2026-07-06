(() => {
  const data = window.OPTION_DATA;
  const STORAGE_KEY = "efirst-fresh-option-calculator-v1";

  const state = {
    type: data.houseTypes[0],
    selectedByType: {},
    search: "",
    category: "",
    hideUnavailable: true,
    collapsedCategories: new Set()
  };

  const optionById = new Map(data.options.map((option) => [option.id, option]));
  const categories = Array.from(new Set(data.options.map((option) => option.category)));

  const els = {
    dataVersion: document.querySelector("#dataVersion"),
    typeSelect: document.querySelector("#typeSelect"),
    searchInput: document.querySelector("#searchInput"),
    categoryFilter: document.querySelector("#categoryFilter"),
    hideUnavailable: document.querySelector("#hideUnavailable"),
    resultCount: document.querySelector("#resultCount"),
    optionList: document.querySelector("#optionList"),
    totalAmount: document.querySelector("#totalAmount"),
    mobileTotalAmount: document.querySelector("#mobileTotalAmount"),
    selectedCount: document.querySelector("#selectedCount"),
    categoryTotals: document.querySelector("#categoryTotals"),
    warningBox: document.querySelector("#warningBox"),
    warnings: document.querySelector("#warnings"),
    selectedList: document.querySelector("#selectedList"),
    copySummaryBtn: document.querySelector("#copySummaryBtn"),
    shareLinkBtn: document.querySelector("#shareLinkBtn"),
    downloadCsvBtn: document.querySelector("#downloadCsvBtn"),
    printBtn: document.querySelector("#printBtn"),
    resetBtn: document.querySelector("#resetBtn"),
    expandAllBtn: document.querySelector("#expandAllBtn"),
    collapseAllBtn: document.querySelector("#collapseAllBtn"),
    mobileSummaryBtn: document.querySelector("#mobileSummaryBtn"),
    toast: document.querySelector("#toast")
  };

  function formatCurrency(value) {
    return `${Number(value || 0).toLocaleString("ko-KR")}원`;
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function getPrice(option, type = state.type) {
    const value = option.prices[type];
    return typeof value === "number" ? value : null;
  }

  function selectedSet() {
    if (!state.selectedByType[state.type]) {
      state.selectedByType[state.type] = [];
    }
    return new Set(state.selectedByType[state.type].map(Number));
  }

  function setSelectedSet(set) {
    state.selectedByType[state.type] = Array.from(set).sort((a, b) => a - b);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      type: state.type,
      selectedByType: state.selectedByType,
      hideUnavailable: state.hideUnavailable
    }));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (data.houseTypes.includes(saved.type)) state.type = saved.type;
      if (saved.selectedByType && typeof saved.selectedByType === "object") state.selectedByType = saved.selectedByType;
      if (typeof saved.hideUnavailable === "boolean") state.hideUnavailable = saved.hideUnavailable;
    } catch {
      // 손상된 저장값은 무시하고 기본값으로 시작합니다.
    }

    const params = new URLSearchParams(window.location.search);
    const urlType = params.get("type");
    const urlSelected = params.get("sel");

    if (data.houseTypes.includes(urlType)) {
      state.type = urlType;
    }

    if (urlSelected !== null) {
      const ids = urlSelected
        .split(",")
        .map((item) => Number(item))
        .filter((id) => optionById.has(id));
      state.selectedByType[state.type] = Array.from(new Set(ids)).sort((a, b) => a - b);
    }
  }

  function setupControls() {
    els.dataVersion.textContent = `데이터 기준: ${data.dataVersion}`;
    els.typeSelect.innerHTML = data.houseTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("");
    els.categoryFilter.innerHTML = [
      `<option value="">전체</option>`,
      ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    ].join("");

    els.typeSelect.value = state.type;
    els.hideUnavailable.checked = state.hideUnavailable;

    els.typeSelect.addEventListener("change", () => {
      state.type = els.typeSelect.value;
      saveState();
      render();
    });

    els.searchInput.addEventListener("input", () => {
      state.search = els.searchInput.value.trim();
      render();
    });

    els.categoryFilter.addEventListener("change", () => {
      state.category = els.categoryFilter.value;
      render();
    });

    els.hideUnavailable.addEventListener("change", () => {
      state.hideUnavailable = els.hideUnavailable.checked;
      saveState();
      render();
    });

    els.optionList.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-option-id]");
      if (!input) return;
      toggleOption(Number(input.dataset.optionId), input.checked);
    });

    els.optionList.addEventListener("toggle", (event) => {
      const details = event.target.closest("details[data-category]");
      if (!details) return;
      if (details.open) state.collapsedCategories.delete(details.dataset.category);
      else state.collapsedCategories.add(details.dataset.category);
    }, true);

    els.expandAllBtn.addEventListener("click", () => {
      state.collapsedCategories.clear();
      render();
    });

    els.collapseAllBtn.addEventListener("click", () => {
      categories.forEach((category) => state.collapsedCategories.add(category));
      render();
    });

    els.copySummaryBtn.addEventListener("click", copySummary);
    els.shareLinkBtn.addEventListener("click", copyShareLink);
    els.downloadCsvBtn.addEventListener("click", downloadCsv);
    els.printBtn.addEventListener("click", () => window.print());
    els.resetBtn.addEventListener("click", resetSelections);
    els.mobileSummaryBtn.addEventListener("click", () => {
      document.querySelector(".summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function toggleOption(id, checked) {
    const option = optionById.get(id);
    if (!option || getPrice(option) === null) return;

    const selected = selectedSet();

    if (checked) {
      if (option.exclusiveGroup) {
        data.options
          .filter((candidate) => candidate.exclusiveGroup === option.exclusiveGroup && candidate.id !== id)
          .forEach((candidate) => selected.delete(candidate.id));
      }
      selected.add(id);
    } else {
      selected.delete(id);
    }

    setSelectedSet(selected);
    saveState();
    render();
  }

  function filteredOptions() {
    const keyword = normalize(state.search);
    return data.options.filter((option) => {
      const price = getPrice(option);
      if (state.hideUnavailable && price === null) return false;
      if (state.category && option.category !== state.category) return false;
      if (!keyword) return true;
      const haystack = normalize([
        option.category,
        option.item,
        option.configuration,
        option.manufacturer,
        option.exclusiveGroup,
        option.note
      ].join(" "));
      return haystack.includes(keyword);
    });
  }

  function render() {
    els.typeSelect.value = state.type;
    els.hideUnavailable.checked = state.hideUnavailable;

    const selected = selectedSet();
    const options = filteredOptions();
    const grouped = groupBy(options, (option) => option.category);

    els.resultCount.textContent = `${options.length.toLocaleString("ko-KR")}개 표시 중`;
    els.optionList.innerHTML = options.length
      ? categories.filter((category) => grouped[category]?.length).map((category) => renderCategory(category, grouped[category], selected)).join("")
      : `<p class="empty" style="padding:18px;">조건에 맞는 옵션이 없습니다.</p>`;

    renderSummary(selected);
  }

  function renderCategory(category, options, selected) {
    const subtotal = options
      .filter((option) => selected.has(option.id))
      .reduce((sum, option) => sum + (getPrice(option) || 0), 0);
    const checkedCount = options.filter((option) => selected.has(option.id)).length;
    const isOpen = !state.collapsedCategories.has(category);

    return `
      <details class="category" data-category="${escapeHtml(category)}" ${isOpen ? "open" : ""}>
        <summary>
          <span>${escapeHtml(category)}</span>
          <span class="category-meta">
            <span>${checkedCount}개 선택</span>
            <span>${formatCurrency(subtotal)}</span>
          </span>
        </summary>
        <div>
          ${options.map((option) => renderOptionRow(option, selected)).join("")}
        </div>
      </details>
    `;
  }

  function renderOptionRow(option, selected) {
    const price = getPrice(option);
    const unavailable = price === null;
    const checked = selected.has(option.id) && !unavailable;
    const hasCondition = getConditionLines(option).length > 0;

    return `
      <article class="option-row ${checked ? "is-selected" : ""} ${unavailable ? "is-unavailable" : ""}">
        <input
          class="option-check"
          type="checkbox"
          data-option-id="${option.id}"
          ${checked ? "checked" : ""}
          ${unavailable ? "disabled" : ""}
          aria-label="${escapeHtml(option.item)} 선택"
        />
        <div>
          <div class="option-title">
            <span>${escapeHtml(option.item)}</span>
            ${option.manufacturer ? `<span class="badge">${escapeHtml(option.manufacturer)}</span>` : ""}
            ${option.exclusiveGroup ? `<span class="badge badge--choice">택1</span>` : ""}
            ${hasCondition ? `<span class="badge badge--condition">조건</span>` : ""}
          </div>
          <p class="option-config">${escapeHtml(option.configuration)}</p>
          ${option.note ? `<p class="option-note">${escapeHtml(option.note)}</p>` : ""}
        </div>
        <div class="option-price">${unavailable ? "해당 없음" : formatCurrency(price)}</div>
      </article>
    `;
  }

  function renderSummary(selected) {
    const selectedOptions = getSelectedOptions(selected);
    const total = selectedOptions.reduce((sum, option) => sum + getPrice(option), 0);

    els.totalAmount.textContent = formatCurrency(total);
    els.mobileTotalAmount.textContent = formatCurrency(total);
    els.selectedCount.textContent = `선택 ${selectedOptions.length.toLocaleString("ko-KR")}개`;

    const totals = groupBy(selectedOptions, (option) => option.category);
    const subtotalRows = categories
      .filter((category) => totals[category]?.length)
      .map((category) => {
        const subtotal = totals[category].reduce((sum, option) => sum + getPrice(option), 0);
        return `<div class="subtotal-item"><span>${escapeHtml(category)}</span><strong>${formatCurrency(subtotal)}</strong></div>`;
      });

    els.categoryTotals.innerHTML = subtotalRows.length ? subtotalRows.join("") : `<p class="empty">선택된 옵션이 없습니다.</p>`;

    const warnings = getWarnings(selected);
    els.warningBox.style.display = warnings.length ? "block" : "none";
    els.warnings.innerHTML = warnings.map((warning) => `<div class="warning">${escapeHtml(warning)}</div>`).join("");

    els.selectedList.innerHTML = selectedOptions.length
      ? selectedOptions.map((option) => `
          <div class="selected-item">
            <div>
              <strong>${escapeHtml(option.item)}</strong>
              <small>${escapeHtml(shorten(option.configuration, 52))}</small>
            </div>
            <em>${formatCurrency(getPrice(option))}</em>
          </div>
        `).join("")
      : `<p class="empty">선택된 옵션이 없습니다.</p>`;
  }

  function getSelectedOptions(selected) {
    return data.options
      .filter((option) => selected.has(option.id))
      .filter((option) => getPrice(option) !== null);
  }

  function getWarnings(selected) {
    const selectedOptions = data.options.filter((option) => selected.has(option.id));
    const selectedAvailable = getSelectedOptions(selected);
    const warnings = [];

    selectedOptions
      .filter((option) => getPrice(option) === null)
      .forEach((option) => warnings.push(`${state.type} 주택형에서 제공되지 않는 옵션입니다: ${option.item}`));

    const groupedExclusive = groupBy(selectedOptions.filter((option) => option.exclusiveGroup), (option) => option.exclusiveGroup);
    Object.entries(groupedExclusive).forEach(([group, options]) => {
      if (options.length > 1) warnings.push(`${group}은 택1 항목입니다. 하나만 선택해 주세요.`);
    });

    selectedAvailable.forEach((option) => {
      getConditionChecks(option).forEach((check) => {
        const matched = selectedAvailable.some((candidate) => candidate.id !== option.id && matchesKeyword(candidate, check.keyword));
        if (check.type === "required" && !matched) {
          warnings.push(`${option.item}: '${check.keyword}' 선택 조건을 확인해 주세요.`);
        }
        if (check.type === "forbidden" && matched) {
          warnings.push(`${option.item}: '${check.keyword}' 미선택 조건을 확인해 주세요.`);
        }
      });

      getConditionLines(option).forEach((line) => warnings.push(`${option.item}: ${line}`));
    });

    warnings.push("본 계산 결과는 참고용이며, 실제 계약 전 공식 공고문과 계약서를 확인해 주세요.");
    return Array.from(new Set(warnings));
  }

  function getConditionLines(option) {
    return [option.configuration, option.note]
      .join("\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /선택 시|미선택 시|구매 가능|전용/.test(line))
      .filter(lineAppliesToCurrentType);
  }

  function lineAppliesToCurrentType(line) {
    const compact = normalize(line);
    const specificMentions = data.houseTypes.filter((type) => compact.includes(normalize(`${type}타입`)));
    const familyMentions = ["51", "55", "59"].filter((family) => compact.includes(`${family}타입`));

    if (!specificMentions.length && !familyMentions.length) return true;
    if (specificMentions.includes(state.type)) return true;
    return familyMentions.some((family) => state.type.startsWith(family));
  }

  function getConditionChecks(option) {
    const checks = [];
    getConditionLines(option).forEach((line) => {
      const matches = line.matchAll(/‘([^’]+)’\s*(미선택|선택)\s*시/g);
      for (const match of matches) {
        checks.push({
          keyword: match[1].trim(),
          type: match[2] === "선택" ? "required" : "forbidden"
        });
      }
    });
    return checks;
  }

  function matchesKeyword(option, keyword) {
    const target = normalize([option.item, option.configuration].join(" "));
    return target.includes(normalize(keyword));
  }

  function resetSelections() {
    const count = selectedSet().size;
    if (!count) {
      showToast("초기화할 선택 항목이 없습니다.");
      return;
    }
    if (!window.confirm(`${state.type} 주택형의 선택 옵션 ${count}개를 모두 초기화할까요?`)) return;
    state.selectedByType[state.type] = [];
    saveState();
    render();
    showToast("선택 내역을 초기화했습니다.");
  }

  function summaryText() {
    const selected = selectedSet();
    const selectedOptions = getSelectedOptions(selected);
    const total = selectedOptions.reduce((sum, option) => sum + getPrice(option), 0);
    const lines = [
      "[e편한세상 분당 퍼스트빌리지 옵션 선택내역]",
      `주택형: ${state.type}`,
      `총 선택금액: ${formatCurrency(total)}`,
      `선택 개수: ${selectedOptions.length}개`,
      "",
      ...selectedOptions.map((option, index) => `${index + 1}. ${option.category} / ${option.item} / ${formatCurrency(getPrice(option))}`)
    ];
    const warnings = getWarnings(selected);
    if (warnings.length) lines.push("", "[점검사항]", ...warnings.map((warning) => `- ${warning}`));
    return lines.join("\n");
  }

  async function copySummary() {
    await writeClipboard(summaryText());
    showToast("선택내역을 복사했습니다.");
  }

  async function copyShareLink() {
    const selected = state.selectedByType[state.type] || [];
    const url = new URL(window.location.href);
    url.searchParams.set("type", state.type);
    if (selected.length) url.searchParams.set("sel", selected.join(","));
    else url.searchParams.delete("sel");
    await writeClipboard(url.toString());
    showToast("공유 링크를 복사했습니다.");
  }

  function downloadCsv() {
    const selectedOptions = getSelectedOptions(selectedSet());
    const rows = [
      ["주택형", "구분", "품목", "구성/조건", "제조사", "택1그룹", "금액", "비고"],
      ...selectedOptions.map((option) => [
        state.type,
        option.category,
        option.item,
        option.configuration.replace(/\n/g, " "),
        option.manufacturer,
        option.exclusiveGroup,
        getPrice(option),
        option.note.replace(/\n/g, " ")
      ]),
      ["", "", "", "", "", "총 선택금액", selectedOptions.reduce((sum, option) => sum + getPrice(option), 0), ""]
    ];
    const csv = "\ufeff" + rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `옵션선택내역_${state.type}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 1900);
  }

  function groupBy(items, getKey) {
    return items.reduce((acc, item) => {
      const key = getKey(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function shorten(text, maxLength) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  loadState();
  setupControls();
  render();
})();
