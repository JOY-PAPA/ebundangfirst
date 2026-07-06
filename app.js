(() => {
  const data = window.OPTION_DATA;
  const STORAGE_KEY = "efirstvillage-option-calculator-v1";

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

  const conditionRules = [
    { ids: [15], requiredAny: [23, 24, 25, 26], message: "디자인 월(아일랜드장 선택 시)은 아일랜드장 선택 여부를 함께 확인해 주세요." },
    { ids: [17], requiredAny: [14, 15], message: "인피니티 도어(전체)는 디자인 월 선택 시 구매 가능한 조건입니다." },
    { ids: [23, 25], forbiddenAny: [22], message: "아일랜드장 기본형/식탁결합형 중 ‘상판 업그레이드 미선택 시’ 항목은 주방 상판/벽 마감재 업그레이드 미선택 조건입니다." },
    { ids: [24, 26], requiredAny: [22], message: "아일랜드장 중 ‘상판 업그레이드 선택 시’ 항목은 주방 상판/벽 마감재 업그레이드 선택 조건입니다." },
    { ids: [35], forbiddenAny: [34], message: "실별 환기·공기청정 시스템 중 ‘스위치 포함’ 항목은 스마트홈 연계 조명 시스템 미선택 조건입니다." },
    { ids: [36], requiredAny: [34], message: "실별 환기·공기청정 시스템 중 ‘D-에어플래너’ 항목은 스마트홈 연계 조명 시스템 선택 조건입니다." },
    { ids: [37], forbiddenAny: [29], message: "빌트인 드레스룸 제습기 단독형은 침실1 파우더 결합형 드레스룸 붙박이장 미선택 조건입니다." },
    { ids: [38], requiredAny: [29], message: "빌트인 드레스룸 제습기 붙박이장 연계형은 침실1 파우더 결합형 드레스룸 붙박이장 선택 조건입니다." },
    { ids: [44], requiredAny: [28], message: "의류관리기는 침실1 와이드 붙박이장 의류관리기형 선택 시 구매 가능한 조건입니다." },
    { ids: [45, 46, 47], requiredAny: [23, 24, 25, 26], message: "빌트인 전기 오븐은 아일랜드장 선택 시 구매 가능한 조건입니다." },
    { ids: [48, 49], requiredAny: [21], message: "빌트인 냉장고는 냉장고장 선택 시 구매 가능한 조건입니다." }
  ];

  const els = {
    typeSelect: document.querySelector("#typeSelect"),
    searchInput: document.querySelector("#searchInput"),
    categoryFilter: document.querySelector("#categoryFilter"),
    hideUnavailable: document.querySelector("#hideUnavailable"),
    optionList: document.querySelector("#optionList"),
    resultCount: document.querySelector("#resultCount"),
    totalAmount: document.querySelector("#totalAmount"),
    selectedCount: document.querySelector("#selectedCount"),
    categoryTotals: document.querySelector("#categoryTotals"),
    warnings: document.querySelector("#warnings"),
    warningCard: document.querySelector("#warningCard"),
    selectedList: document.querySelector("#selectedList"),
    dataVersion: document.querySelector("#dataVersion"),
    mobileTotalAmount: document.querySelector("#mobileTotalAmount"),
    mobileSummaryBtn: document.querySelector("#mobileSummaryBtn"),
    copySummaryBtn: document.querySelector("#copySummaryBtn"),
    shareLinkBtn: document.querySelector("#shareLinkBtn"),
    downloadCsvBtn: document.querySelector("#downloadCsvBtn"),
    printBtn: document.querySelector("#printBtn"),
    resetBtn: document.querySelector("#resetBtn"),
    expandAllBtn: document.querySelector("#expandAllBtn"),
    collapseAllBtn: document.querySelector("#collapseAllBtn"),
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
    return new Set(state.selectedByType[state.type]);
  }

  function setSelectedSet(set) {
    state.selectedByType[state.type] = Array.from(set).sort((a, b) => a - b);
  }

  function saveState() {
    const serializable = {
      type: state.type,
      selectedByType: state.selectedByType,
      hideUnavailable: state.hideUnavailable
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  }

  function loadState() {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get("type");
    const urlSelected = params.get("sel");

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.type && data.houseTypes.includes(saved.type)) state.type = saved.type;
      if (saved.selectedByType && typeof saved.selectedByType === "object") state.selectedByType = saved.selectedByType;
      if (typeof saved.hideUnavailable === "boolean") state.hideUnavailable = saved.hideUnavailable;
    } catch {
      // 저장 데이터가 손상된 경우 기본값으로 시작합니다.
    }

    if (urlType && data.houseTypes.includes(urlType)) {
      state.type = urlType;
    }

    if (urlSelected) {
      const ids = urlSelected
        .split(",")
        .map((item) => Number(item))
        .filter((id) => optionById.has(id));
      state.selectedByType[state.type] = Array.from(new Set(ids)).sort((a, b) => a - b);
    }
  }

  function setupControls() {
    els.typeSelect.innerHTML = data.houseTypes
      .map((type) => `<option value="${type}">${type}</option>`)
      .join("");

    els.categoryFilter.innerHTML = [
      `<option value="">전체</option>`,
      ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    ].join("");

    els.typeSelect.value = state.type;
    els.hideUnavailable.checked = state.hideUnavailable;
    els.dataVersion.textContent = `데이터 기준: ${data.dataVersion || "공식 자료 확인 필요"}`;

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

    els.copySummaryBtn.addEventListener("click", copySummary);
    els.shareLinkBtn.addEventListener("click", copyShareLink);
    els.downloadCsvBtn.addEventListener("click", downloadCsv);
    els.mobileSummaryBtn.addEventListener("click", () => {
      document.querySelector(".summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    els.printBtn.addEventListener("click", () => window.print());
    els.resetBtn.addEventListener("click", resetSelections);
    els.expandAllBtn.addEventListener("click", () => {
      state.collapsedCategories.clear();
      render();
    });
    els.collapseAllBtn.addEventListener("click", () => {
      categories.forEach((category) => state.collapsedCategories.add(category));
      render();
    });
  }

  function toggleOption(id, checked) {
    const option = optionById.get(id);
    if (!option || getPrice(option) === null) return;

    const selected = selectedSet();

    if (checked) {
      if (option.exclusiveGroup) {
        data.options
          .filter((candidate) => candidate.exclusiveGroup === option.exclusiveGroup && candidate.id !== option.id)
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

  function resetSelections() {
    const count = selectedSet().size;
    if (count === 0) {
      showToast("초기화할 선택 항목이 없습니다.");
      return;
    }

    const confirmed = window.confirm(`${state.type} 주택형의 선택 옵션 ${count}개를 모두 초기화할까요?`);
    if (!confirmed) return;

    state.selectedByType[state.type] = [];
    saveState();
    render();
    showToast("선택 내역을 초기화했습니다.");
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

    els.resultCount.textContent = `${options.length.toLocaleString("ko-KR")}개 옵션 표시 중`;

    if (options.length === 0) {
      els.optionList.innerHTML = `<p class="empty" style="padding: 22px;">조건에 맞는 옵션이 없습니다.</p>`;
    } else {
      els.optionList.innerHTML = categories
        .filter((category) => grouped[category]?.length)
        .map((category) => renderCategory(category, grouped[category], selected))
        .join("");
    }

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
          <span class="category__meta">
            <span>${checkedCount}개 선택</span>
            <span>${formatCurrency(subtotal)}</span>
          </span>
        </summary>
        <div class="category__body">
          ${options.map((option) => renderOptionRow(option, selected)).join("")}
        </div>
      </details>
    `;
  }

  function renderOptionRow(option, selected) {
    const price = getPrice(option);
    const unavailable = price === null;
    const checked = selected.has(option.id) && !unavailable;
    const hasCondition = conditionRules.some((rule) => rule.ids.includes(option.id));

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
          <h3 class="option-title">
            <span>${escapeHtml(option.item)}</span>
            ${option.manufacturer ? `<span class="badge">${escapeHtml(option.manufacturer)}</span>` : ""}
            ${option.exclusiveGroup ? `<span class="badge">${escapeHtml(option.exclusiveGroup)}</span>` : ""}
            ${hasCondition ? `<span class="badge badge--condition">조건 확인</span>` : ""}
          </h3>
          <p class="option-config">${escapeHtml(option.configuration)}</p>
          ${option.note ? `<div class="option-note">${escapeHtml(option.note)}</div>` : ""}
        </div>
        <div class="option-price">${unavailable ? "해당 없음" : formatCurrency(price)}</div>
      </article>
    `;
  }

  function renderSummary(selected) {
    const selectedOptions = data.options
      .filter((option) => selected.has(option.id))
      .filter((option) => getPrice(option) !== null);

    const total = selectedOptions.reduce((sum, option) => sum + getPrice(option), 0);

    els.totalAmount.textContent = formatCurrency(total);
    els.mobileTotalAmount.textContent = formatCurrency(total);
    els.selectedCount.textContent = `선택 ${selectedOptions.length.toLocaleString("ko-KR")}개`;

    const totals = groupBy(selectedOptions, (option) => option.category);
    const subtotalRows = categories
      .filter((category) => totals[category]?.length)
      .map((category) => {
        const subtotal = totals[category].reduce((sum, option) => sum + getPrice(option), 0);
        return `
          <div class="subtotal-item">
            <span>${escapeHtml(category)}</span>
            <strong>${formatCurrency(subtotal)}</strong>
          </div>
        `;
      });

    els.categoryTotals.innerHTML = subtotalRows.length ? subtotalRows.join("") : `<p class="empty">선택된 옵션이 없습니다.</p>`;

    const warnings = getWarnings(selected);
    els.warningCard.style.display = warnings.length ? "block" : "none";
    els.warnings.innerHTML = warnings.map((warning) => `<div class="warning">${escapeHtml(warning)}</div>`).join("");

    els.selectedList.innerHTML = selectedOptions.length
      ? selectedOptions.map((option) => `
          <div class="selected-item">
            <div>
              <strong>${escapeHtml(option.item)}</strong>
              <small>${escapeHtml(shorten(option.configuration, 58))}</small>
            </div>
            <em>${formatCurrency(getPrice(option))}</em>
          </div>
        `).join("")
      : `<p class="empty">선택된 옵션이 없습니다.</p>`;
  }

  function getWarnings(selected) {
    const warnings = [];
    const selectedOptions = data.options.filter((option) => selected.has(option.id));

    const unavailable = selectedOptions.filter((option) => getPrice(option) === null);
    unavailable.forEach((option) => warnings.push(`${state.type} 주택형에서 제공되지 않는 옵션이 선택되어 있어 합계에서 제외했습니다: ${option.item}`));

    const groupedExclusive = groupBy(
      selectedOptions.filter((option) => option.exclusiveGroup),
      (option) => option.exclusiveGroup
    );
    Object.entries(groupedExclusive).forEach(([groupName, options]) => {
      if (options.length > 1) {
        warnings.push(`${groupName}은 택1 항목입니다. 하나만 선택해 주세요.`);
      }
    });

    conditionRules.forEach((rule) => {
      const applies = rule.ids.some((id) => selected.has(id));
      if (!applies) return;

      if (rule.requiredAny && !rule.requiredAny.some((id) => selected.has(id))) {
        warnings.push(rule.message);
      }

      if (rule.forbiddenAny && rule.forbiddenAny.some((id) => selected.has(id))) {
        warnings.push(rule.message);
      }
    });

    return Array.from(new Set(warnings));
  }

  function summaryText() {
    const selected = selectedSet();
    const selectedOptions = data.options
      .filter((option) => selected.has(option.id))
      .filter((option) => getPrice(option) !== null);

    const total = selectedOptions.reduce((sum, option) => sum + getPrice(option), 0);

    const lines = [
      "[e편한세상 분당 퍼스트빌리지 옵션 선택내역]",
      `주택형: ${state.type}`,
      `총 선택금액: ${formatCurrency(total)}`,
      `선택 개수: ${selectedOptions.length}개`,
      "",
      ...selectedOptions.map((option, index) => `${index + 1}. ${option.category} / ${option.item} / ${formatCurrency(getPrice(option))}`),
    ];

    const warnings = getWarnings(selected);
    if (warnings.length) {
      lines.push("", "[점검사항]", ...warnings.map((warning) => `- ${warning}`));
    }

    lines.push("", "※ 본 계산 결과는 참고용이며, 실제 계약 전 공식 공고문과 계약서를 확인해 주세요.");

    return lines.join("\n");
  }

  async function copySummary() {
    const text = summaryText();
    await writeClipboard(text);
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
    const selected = selectedSet();
    const selectedOptions = data.options
      .filter((option) => selected.has(option.id))
      .filter((option) => getPrice(option) !== null);

    const rows = [
      ["주택형", "구분", "품목", "구성/조건", "제조사", "금액"],
      ...selectedOptions.map((option) => [
        state.type,
        option.category,
        option.item,
        option.configuration.replace(/\n/g, " "),
        option.manufacturer,
        getPrice(option)
      ]),
      ["", "", "", "", "총 선택금액", selectedOptions.reduce((sum, option) => sum + getPrice(option), 0)]
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
    showToast.timer = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, 1900);
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
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function shorten(text, maxLength) {
    const singleLine = String(text || "").replace(/\s+/g, " ").trim();
    return singleLine.length > maxLength ? `${singleLine.slice(0, maxLength)}…` : singleLine;
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
