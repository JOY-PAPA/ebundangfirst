# AGENTS.md

## Project goal

This repository is a static Korean option-price calculator for apartment prospective buyers.

## Non-negotiable requirements

- Keep the app as a static website unless explicitly requested otherwise.
- Do not add a backend, database, analytics script, tracking pixel, login, or personal information form.
- Preserve Korean labels and wording.
- Keep option data separated in `option-data.js`.
- All price calculations must be derived from selected option IDs and the selected house type.
- `exclusiveGroup` means only one selected option is allowed in the same group.
- Keep the disclaimer that the calculator is for reference only and official notices/contracts control.

## Code style

- Plain HTML, CSS, and vanilla JavaScript are preferred.
- Avoid unnecessary dependencies and build tools.
- Keep mobile usability strong because many residents will open the link from KakaoTalk.
- Any new feature should work on GitHub Pages.

## Testing checklist

- Open `index.html` in a browser.
- Select each house type and verify prices change.
- Select multiple options and verify total/subtotals.
- Test exclusive groups: selecting one should unselect the other in the same group.
- Test copy summary, share link, CSV download, print/PDF.
