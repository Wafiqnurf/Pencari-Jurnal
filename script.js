const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const yearFrom = document.getElementById("year-from");
const yearTo = document.getElementById("year-to");
const resultsList = document.getElementById("results");
const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

let currentPage = 1;
let totalPages = 1;
let lastQuery = "";
let lastYearFrom = "";
let lastYearTo = "";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  currentPage = 1;
  await performSearch();
});

prevButton.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    await performSearch();
  }
});

nextButton.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    currentPage++;
    await performSearch();
  }
});

async function performSearch() {
  const query = input.value || lastQuery;
  const fromYear = yearFrom.value || lastYearFrom;
  const toYear = yearTo.value || lastYearTo;
  if (!query) return;

  lastQuery = query;
  lastYearFrom = fromYear;
  lastYearTo = toYear;

  resultsList.innerHTML = "Mencari...";
  updatePaginationVisibility(false);

  try {
    let url = `https://api.crossref.org/works?query=${encodeURIComponent(
      query
    )}&rows=10&offset=${(currentPage - 1) * 10}&sort=relevance`;
    if (fromYear && toYear) {
      url += `&filter=from-pub-date:${fromYear},until-pub-date:${toYear}`;
    } else if (fromYear) {
      url += `&filter=from-pub-date:${fromYear}`;
    } else if (toYear) {
      url += `&filter=until-pub-date:${toYear}`;
    }

    const response = await axios.get(url);
    const results = response.data.message.items;
    totalPages = Math.ceil(response.data.message["total-results"] / 10);
    displayResults(results);
    updatePagination();
  } catch (error) {
    console.error("Error:", error);
    resultsList.innerHTML =
      "Terjadi kesalahan saat mencari. Silakan coba lagi.";
    updatePaginationVisibility(false);
  }
}

function displayResults(results) {
  resultsList.innerHTML = "";
  const filteredResults = results.filter(
    (result) => result.title && result.title.length > 0
  );

  if (filteredResults.length === 0) {
    resultsList.innerHTML = "Tidak ada hasil ditemukan.";
    return;
  }

  filteredResults.forEach((result) => {
    const li = document.createElement("li");
    li.className = "result-item";
    li.innerHTML = `
                    <div class="result-title">${result.title[0]}</div>
                    <div class="result-authors">${
                      result.author
                        ? result.author
                            .map((a) => a.given + " " + a.family)
                            .join(", ")
                        : "Penulis tidak tersedia"
                    }</div>
                    <div class="result-source">Sumber: ${result.publisher}</div>
                    <div class="result-year">Tahun: ${
                      result.published
                        ? result.published["date-parts"][0][0]
                        : "Tidak tersedia"
                    }</div>
                    ${
                      result.URL
                        ? `<a href="${result.URL}" class="result-link" target="_blank">Lihat Artikel</a>`
                        : ""
                    }
                `;
    resultsList.appendChild(li);
  });
}

function updatePagination() {
  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
  updatePaginationVisibility(true);
}

function updatePaginationVisibility(visible) {
  if (visible) {
    prevButton.style.display = "inline-block";
    nextButton.style.display = "inline-block";
    pageInfo.style.display = "inline-block";
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
  } else {
    prevButton.style.display = "none";
    nextButton.style.display = "none";
    pageInfo.style.display = "none";
  }
}

// Initial search to populate the page
performSearch();
