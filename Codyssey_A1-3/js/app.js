const ingredientInput = document.querySelector("#ingredientInput");
const addIngredientButton = document.querySelector("#addIngredientButton");
const ingredientTags = document.querySelector("#ingredientTags");
const ingredientHelp = document.querySelector("#ingredientHelp");
const ingredientCounter = document.querySelector("#ingredientCounter");
const conditionInput = document.querySelector("#conditionInput");
const recommendButton = document.querySelector("#recommendButton");
const retryButton = document.querySelector("#retryButton");
const statusMessage = document.querySelector("#statusMessage");
const resultsSection = document.querySelector("#resultsSection");
const recipeGrid = document.querySelector("#recipeGrid");
const favoritesToggle = document.querySelector("#favoritesToggle");
const favoriteCount = document.querySelector("#favoriteCount");
const favoritesSection = document.querySelector("#favoritesSection");
const favoritesGrid = document.querySelector("#favoritesGrid");
const closeFavorites = document.querySelector("#closeFavorites");
const emptyFavorites = document.querySelector("#emptyFavorites");
const conditionChips = document.querySelectorAll(".condition-chip");

const MAX_INGREDIENTS = 30;
let ingredients = [];
let currentRecipes = [];
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem("fridgeFavorites"));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem("fridgeFavorites", JSON.stringify(favorites));
  favoriteCount.textContent = favorites.length;
}

function setStatus(message = "", type = "") {
  statusMessage.textContent = message;
  statusMessage.classList.remove("error", "success");
  if (type) statusMessage.classList.add(type);
}

function normalizeIngredient(value) {
  return value.trim().replace(/\s+/g, " ");
}

function addIngredient() {
  const value = normalizeIngredient(ingredientInput.value);

  if (!value) {
    setStatus("재료를 먼저 입력해 주세요.", "error");
    ingredientInput.focus();
    return;
  }

  if (ingredients.length >= MAX_INGREDIENTS) {
    setStatus("재료는 최대 30개까지 입력할 수 있어요.", "error");
    return;
  }

  if (ingredients.some((item) => item.toLowerCase() === value.toLowerCase())) {
    setStatus("이미 추가한 재료예요.", "error");
    ingredientInput.select();
    return;
  }

  ingredients.push(value);
  ingredientInput.value = "";
  setStatus();
  renderIngredientTags();
  ingredientInput.focus();
}

function renderIngredientTags() {
  ingredientTags.innerHTML = "";

  ingredients.forEach((ingredient, index) => {
    const tag = document.createElement("span");
    tag.className = "tag";

    const text = document.createElement("span");
    text.textContent = ingredient;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `${ingredient} 삭제`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      ingredients.splice(index, 1);
      renderIngredientTags();
      setStatus(`${ingredient} 재료를 삭제했어요.`);
    });

    tag.append(text, removeButton);
    ingredientTags.appendChild(tag);
  });

  ingredientHelp.textContent = ingredients.length
    ? "등록한 재료의 × 버튼을 누르면 삭제할 수 있어요."
    : "Enter 또는 + 추가를 눌러 재료를 등록하세요.";
  ingredientCounter.textContent = `${ingredients.length} / ${MAX_INGREDIENTS}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function recipeKey(recipe) {
  return recipe.id || recipe.name;
}

function isFavorite(recipe) {
  const key = recipeKey(recipe);
  return favorites.some((item) => recipeKey(item) === key);
}

function toggleFavorite(recipe) {
  const key = recipeKey(recipe);
  const index = favorites.findIndex((item) => recipeKey(item) === key);

  if (index >= 0) {
    favorites.splice(index, 1);
    setStatus("즐겨찾기에서 삭제했어요.");
  } else {
    favorites.unshift(recipe);
    setStatus("즐겨찾기에 저장했어요.", "success");
  }

  saveFavorites();
  renderRecipes(currentRecipes, recipeGrid);
  renderFavorites();
}

function createRecipeCard(recipe, index) {
  const article = document.createElement("article");
  article.className = "recipe-card";

  const favoriteButton = document.createElement("button");
  const saved = isFavorite(recipe);
  favoriteButton.type = "button";
  favoriteButton.className = `favorite-button ${saved ? "saved" : ""}`;
  favoriteButton.setAttribute("aria-label", saved ? `${recipe.name} 즐겨찾기 해제` : `${recipe.name} 즐겨찾기 추가`);
  favoriteButton.setAttribute("aria-pressed", String(saved));
  favoriteButton.textContent = saved ? "★" : "☆";
  favoriteButton.addEventListener("click", () => toggleFavorite(recipe));

  const safeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const safeSteps = Array.isArray(recipe.steps) ? recipe.steps : [];

  article.innerHTML = `
    <p class="eyebrow">Recipe ${index + 1}</p>
    <h3>${escapeHtml(recipe.name || "이름 없는 레시피")}</h3>
    <p class="recipe-summary">${escapeHtml(recipe.summary || "")}</p>
    <div class="meta">
      <span>⏱ ${escapeHtml(recipe.time || "시간 미정")}</span>
      <span>난이도 ${escapeHtml(recipe.difficulty || "보통")}</span>
    </div>
    <h4>필요한 재료</h4>
    <ul>${safeIngredients.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <h4>만드는 방법</h4>
    <ol>${safeSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    ${recipe.tip ? `<h4>냉털 팁</h4><p class="recipe-summary">${escapeHtml(recipe.tip)}</p>` : ""}
  `;

  article.appendChild(favoriteButton);
  return article;
}

function renderRecipes(recipes, target) {
  target.innerHTML = "";
  recipes.forEach((recipe, index) => target.appendChild(createRecipeCard(recipe, index)));
}

function renderFavorites() {
  saveFavorites();
  favoritesGrid.innerHTML = "";
  emptyFavorites.classList.toggle("hidden", favorites.length !== 0);
  favorites.forEach((recipe, index) => favoritesGrid.appendChild(createRecipeCard(recipe, index)));
}

async function requestRecommendations() {
  if (ingredients.length === 0) {
    setStatus("재료를 하나 이상 추가해 주세요.", "error");
    ingredientInput.focus();
    return;
  }

  recommendButton.disabled = true;
  recommendButton.classList.add("loading");
  setStatus("냉장고 속 재료를 분석하고 있어요…");

  try {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients,
        condition: conditionInput.value.trim()
      })
    });

    const text = await response.text();
    let payload;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("서버 응답을 읽을 수 없어요. 잠시 후 다시 시도해 주세요.");
    }

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error?.message || "AI 추천을 불러오지 못했어요.");
    }

    if (!Array.isArray(payload.recipes) || payload.recipes.length === 0) {
      throw new Error("추천 결과가 비어 있어요. 다시 시도해 주세요.");
    }

    currentRecipes = payload.recipes;
    renderRecipes(currentRecipes, recipeGrid);
    resultsSection.classList.remove("hidden");
    setStatus("추천이 완성됐어요!", "success");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setStatus(error.message || "추천을 불러오지 못했어요.", "error");
  } finally {
    recommendButton.disabled = false;
    recommendButton.classList.remove("loading");
  }
}

ingredientInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addIngredient();
  }
});

addIngredientButton.addEventListener("click", addIngredient);
recommendButton.addEventListener("click", requestRecommendations);
retryButton.addEventListener("click", () => {
  document.querySelector("#recommend").scrollIntoView({ behavior: "smooth", block: "start" });
  ingredientInput.focus();
});

conditionChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const value = chip.dataset.condition;
    const current = conditionInput.value.trim();
    conditionInput.value = current ? `${current}, ${value}` : value;
    conditionInput.focus();
  });
});

favoritesToggle.addEventListener("click", () => {
  renderFavorites();
  favoritesSection.classList.remove("hidden");
  favoritesSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

closeFavorites.addEventListener("click", () => {
  favoritesSection.classList.add("hidden");
});

saveFavorites();
renderIngredientTags();
