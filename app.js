(function(){
  "use strict";

  var CATEGORIES = ["Déjeuner","Entrée","Plat principal","Collation","Dessert","Pâtisserie","Boisson","Autre"];
  var CATEGORY_COLORS = {
    "Déjeuner": "#c98a3a",
    "Entrée": "#5c8a6e",
    "Plat principal": "#3d5a44",
    "Collation": "#8a6bb0",
    "Dessert": "#b3496b",
    "Pâtisserie": "#a9762f",
    "Boisson": "#3f7f8c",
    "Autre": "#7a7360"
  };
  function categoryColor(cat){ return CATEGORY_COLORS[cat] || CATEGORY_COLORS["Autre"]; }
  var TAB_ALL = "Tous";
  var ICON_CLOCK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 3.2"/></svg>';
  var ICON_PLATE = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/></svg>';
  function heartIcon(filled){
    return filled
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4"><path d="M12 21s-7.2-4.6-9.6-8.9C.7 8.7 2.3 5 5.8 5c2 0 3.4 1 4.4 2.5C11.2 6 12.6 5 14.6 5c3.5 0 5.1 3.7 3.4 7.1C19.2 16.4 12 21 12 21z"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.2-4.6-9.6-8.9C.7 8.7 2.3 5 5.8 5c2 0 3.4 1 4.4 2.5C11.2 6 12.6 5 14.6 5c3.5 0 5.1 3.7 3.4 7.1C19.2 16.4 12 21 12 21z"/></svg>';
  }

  var els = {};
  ["tabs","grid","emptyState","emptyTitle","emptyText","searchInput","countBadge","modeBanner","favToggleBtn",
   "featuredSection","addBtn","detailOverlay","detailSheet","formOverlay","formHeading","formClose","recipeForm","formError",
   "f-title","f-photo","photoDrop","photoThumb","photoIcon","photoTxt","f-story","f-tags","f-cat","f-servings","f-prep",
   "f-cook","f-ingredients","f-steps","f-author","formCancel","formSubmit",
   "confirmOverlay","confirmClose","confirmDeleteBtn","confirmCancelBtn","toast",
   "authWidget","authOpenBtn","authOverlay","authClose","authHeading","authForm","authError",
   "authNameField","a-name","a-email","a-password","authSubmit","authHint","authTabLogin","authTabSignup",
   "cookOverlay","cookSheet","viewSwitch","importBtn","importOverlay","importClose","importSourceUrl","importCancel","importAnalyze","importError","importCat","importTags","importVisibility",
   "blogList","blogEmptyState","blogFormOverlay","blogFormHeading","blogFormClose","blogForm","blogFormError",
   "bf-title","bf-photo","bfPhotoDrop","bfPhotoThumb","bfPhotoIcon","bfPhotoTxt","bf-body","bf-author","bf-source",
   "blogFormCancel","blogFormSubmit","blogDetailOverlay","blogDetailSheet","f-source",
   "familyBadgeBtn","familyOnboardingOverlay","famTabCreate","famTabJoin","famError",
   "famCreateField","famJoinField","fam-name","fam-code","famSubmit",
   "familyInfoOverlay","famInfoHeading","famInfoClose","famInviteCodeBox","discoverGrid","discoverEmptyState","f-visibility","memoryBanner","plannerView",
   "storyToggleBtn","storyFieldBody","sourceInfoBtn","sourceInfoText",
   "addToPlannerOverlay","addToPlannerClose","atp-day","atp-slot","atp-servings","atpCancel","atpConfirm",
   "reportOverlay","reportClose","report-reason","reportError","reportCancel","reportConfirm","famCopyLinkBtn","discoverFilters",
   "notifBellBtn","notifCount","notifOverlay","notifClose","notifTabReceived","notifTabSent","notifBody",
   "familyProfileOverlay","familyProfileHeading","familyProfileClose","familyProfileRegion","familyProfileList",
   "requestAccessOverlay","requestAccessClose","requestAccessRecipeName","request-message","requestAccessCancel","requestAccessConfirm",
   "familySearchBlock","familyNameSearch","familySearchResults","familyGeneralRequestBtn",
   "discoverLayout","discoverSidebarList","followedSection","familyFollowBtn",
   "discoverWrap","discoverQuebecView","discoverTousView","quebecGrid","quebecEmptyState",
   "authRequiredScreen","authRequiredBtn","controlsWrap","mainContent",
   "scanBtn","scanPhotoInput",
   "famRegionEdit","famRegionSaveBtn","myFollowsLink",
   "myFollowsOverlay","myFollowsClose","myFollowsList","myFollowsBellBtn",
   "familyProfileFollowers"
  ].forEach(function(id){ els[id] = document.getElementById(id); });

  var state = {
    recipes: [],
    discoverRecipes: [],
    blogPosts: [],
    view: "recipes",
    session: null,
    activeCategory: TAB_ALL,
    searchTerm: "",
    editingId: null,
    editingBlogId: null,
    pendingPhotoBlob: null,
    pendingPhotoPreviewUrl: null,
    pendingBlogPhotoBlob: null,
    deleteTargetId: null,
    authMode: "login",
    favorites: {},
    showFavoritesOnly: false,
    familyId: null,
    familyName: "",
    familyInviteCode: "",
    isAdminFamily: false,
    familyRegion: "",
    famOnboardMode: "create",
    openRecipeId: null,
    plannerWeekOffset: 0,
    plannerSubView: "horaire",
    mealPlan: {},
    groceryChecks: {},
    manualGroceryItems: [],
    discoverRegion: "",
    discoverTag: "",
    discoverSort: "recent",
    discoverCategory: "",
    followedFamilyIds: [],
    followedRecipesCache: [],
    quebecMapRegion: "",
    discoverSubView: "quebec"
  };

  var supabase = null;
  var configOk = typeof SUPABASE_URL === "string" && SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1;

  if (configOk && window.supabase){
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function num(v){ var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }
  function initialsWord(title){
    var w = (title || "?").trim().split(/\s+/)[0] || "?";
    return w.slice(0,1).toUpperCase();
  }
  function displayName(session){
    if (!session || !session.user) return "";
    var meta = session.user.user_metadata || {};
    return meta.display_name || (session.user.email || "").split("@")[0];
  }

  function toast(msg){
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ els.toast.classList.remove("show"); }, 2800);
  }

  /* ---------------- config guard ---------------- */
  function renderModeBanner(){
    if (!configOk){
      els.modeBanner.hidden = false;
      els.modeBanner.innerHTML = "<span>Ce site n'est pas encore branché à sa base de données. Ouvre le fichier « config.js » et remplace les valeurs d'exemple par celles de ton projet Supabase (voir le fichier README.md).</span>";
      return;
    }
    els.modeBanner.hidden = true;
  }

  /* ---------------- tabs ---------------- */
  function renderTabs(){
    var all = [TAB_ALL].concat(CATEGORIES);
    els.tabs.innerHTML = "";
    all.forEach(function(cat){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tab" + (state.activeCategory === cat ? " active" : "");
      b.textContent = cat;
      b.addEventListener("click", function(){
        state.activeCategory = cat;
        renderTabs();
        renderGrid();
        renderFeatured();
      });
      els.tabs.appendChild(b);
    });
  }
  CATEGORIES.forEach(function(c){
    var o = document.createElement("option");
    o.value = c; o.textContent = c;
    els["f-cat"].appendChild(o);
  });
  if (els.importCat){
    CATEGORIES.forEach(function(c){
      var o2 = document.createElement("option");
      o2.value = c; o2.textContent = c;
      els.importCat.appendChild(o2);
    });
  }

  /* ---------------- grid ---------------- */
  function visibleRecipes(){
    var term = state.searchTerm.trim().toLowerCase();
    return state.recipes.filter(function(r){
      if (state.showFavoritesOnly && !state.favorites[r.id]) return false;
      if (state.activeCategory !== TAB_ALL && r.category !== state.activeCategory) return false;
      if (!term) return true;
      var hay = (r.title + " " + (r.ingredients||[]).join(" ") + " " + (r.tags||[]).join(" ")).toLowerCase();
      return hay.indexOf(term) !== -1;
    });
  }

  function renderGrid(){
    var list = visibleRecipes();
    els.countBadge.innerHTML = "<b>" + state.recipes.length + "</b> recette" + (state.recipes.length === 1 ? "" : "s");

    els.grid.innerHTML = "";
    if (!list.length){
      els.emptyState.hidden = false;
      if (state.recipes.length && (state.searchTerm || state.activeCategory !== TAB_ALL)){
        els.emptyTitle.textContent = "Aucune recette trouvée";
        els.emptyText.textContent = "Essayez une autre catégorie ou un autre mot-clé.";
      } else {
        els.emptyTitle.textContent = "La boîte est vide";
        els.emptyText.textContent = "Ajoutez la toute première recette avec le bouton en bas à droite.";
      }
      return;
    }
    els.emptyState.hidden = true;

    list.forEach(function(r){
      var card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");

      var photoHtml = r.photo_url
        ? '<img src="' + esc(r.photo_url) + '" alt="" loading="lazy">'
        : '<span class="ph-fallback">' + esc(initialsWord(r.title)) + '</span>';

      var tagsHtml = (r.tags && r.tags.length)
        ? '<div class="tag-row">' + r.tags.slice(0,3).map(function(t){ return '<span class="tag-pill">' + esc(t) + '</span>'; }).join("") + '</div>'
        : '';

      card.innerHTML =
        '<div class="card-photo">' + photoHtml +
          '<button type="button" class="card-fav" data-fav aria-label="Favori" aria-pressed="' + (!!state.favorites[r.id]) + '">' + heartIcon(!!state.favorites[r.id]) + '</button>' +
          '<button type="button" class="card-menu-btn" data-card-menu aria-label="Options">⋮</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<p class="card-cat">' + esc(r.category || "Autre") + (r.visibility === "personal" ? ' · 🙈 Personnelle' : '') + (r.is_bookmark ? ' · 🔗 Signet' : '') + '</p>' +
          '<h3 class="card-title">' + esc(r.title) + '</h3>' +
          tagsHtml +
          '<div class="card-meta">' +
            (r.prep_min || r.cook_min ? '<span>' + ICON_CLOCK + ' ' + ((num(r.prep_min)+num(r.cook_min)) || "–") + ' min</span>' : '') +
            (r.servings ? '<span>' + ICON_PLATE + ' ' + num(r.servings) + '</span>' : '') +
          '</div>' +
        '</div>';
      card.addEventListener("click", function(){ openRecipeOrBookmark(r); });
      card.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openRecipeOrBookmark(r); }
      });
      card.addEventListener("contextmenu", function(e){
        e.preventDefault();
        openCardContextMenu(r, e.clientX, e.clientY);
      });
      card.style.setProperty("--cat-color", categoryColor(r.category));
      var favBtn = card.querySelector("[data-fav]");
      favBtn.addEventListener("click", function(e){ e.stopPropagation(); toggleFavorite(r.id); });
      var menuBtn = card.querySelector("[data-card-menu]");
      menuBtn.addEventListener("click", function(e){
        e.stopPropagation();
        var rect = menuBtn.getBoundingClientRect();
        openCardContextMenu(r, rect.left, rect.bottom + 4);
      });
      els.grid.appendChild(card);
    });
  }

  /* ---------------- menu contextuel (modifier / supprimer) ---------------- */
  var cardContextMenuTarget = null;
  function openCardContextMenu(r, x, y){
    cardContextMenuTarget = r;
    var menu = document.getElementById("cardContextMenu");
    menu.hidden = false;
    var menuW = menu.offsetWidth || 150;
    var menuH = menu.offsetHeight || 90;
    var maxX = window.innerWidth - menuW - 8;
    var maxY = window.innerHeight - menuH - 8;
    menu.style.left = Math.max(4, Math.min(x, maxX)) + "px";
    menu.style.top = Math.max(4, Math.min(y, maxY)) + "px";
  }
  function closeCardContextMenu(){
    var menu = document.getElementById("cardContextMenu");
    if (menu) menu.hidden = true;
    cardContextMenuTarget = null;
  }
  document.addEventListener("click", function(e){
    var menu = document.getElementById("cardContextMenu");
    if (menu && !menu.hidden && !menu.contains(e.target)) closeCardContextMenu();
  });
  document.addEventListener("scroll", closeCardContextMenu, true);
  var cardCtxMenuEl = document.getElementById("cardContextMenu");
  if (cardCtxMenuEl){
    cardCtxMenuEl.querySelector("[data-menu-edit]").addEventListener("click", function(){
      if (cardContextMenuTarget) openForm(cardContextMenuTarget);
      closeCardContextMenu();
    });
    cardCtxMenuEl.querySelector("[data-menu-delete]").addEventListener("click", function(){
      if (cardContextMenuTarget){
        state.deleteTargetId = cardContextMenuTarget.id;
        els.confirmOverlay.hidden = false;
      }
      closeCardContextMenu();
    });
  }

  els.searchInput.addEventListener("input", function(e){
    state.searchTerm = e.target.value;
    if (state.view === "discover") renderDiscoverGrid();
    else { renderGrid(); renderFeatured(); }
  });

  if (els.favToggleBtn){
    els.favToggleBtn.addEventListener("click", function(){
      if (!state.session){ openAuth("login"); return; }
      state.showFavoritesOnly = !state.showFavoritesOnly;
      els.favToggleBtn.classList.toggle("active", state.showFavoritesOnly);
      els.favToggleBtn.setAttribute("aria-pressed", String(state.showFavoritesOnly));
      renderGrid();
    });
  }

  /* ---------------- recette vedette ---------------- */
  function renderFeatured(){
    if (!els.featuredSection) return;
    if (!state.recipes.length || state.searchTerm.trim() || state.activeCategory !== TAB_ALL){
      els.featuredSection.hidden = true;
      renderMemoryBanner();
      return;
    }
    var r = state.recipes[0];
    var photoHtml = r.photo_url ? '<img src="' + esc(r.photo_url) + '" alt="">' : '';
    els.featuredSection.innerHTML =
      '<div class="featured-photo">' + photoHtml + '</div>' +
      '<div class="featured-overlay">' +
        '<p class="featured-kicker">✨ Dernière recette ajoutée</p>' +
        '<h2 class="featured-title display">' + esc(r.title) + '</h2>' +
        (r.story ? '<p class="featured-story">' + esc(r.story) + '</p>' : '') +
        '<button class="btn btn-primary" data-featured-open type="button">Voir la recette</button>' +
      '</div>';
    els.featuredSection.hidden = false;
    els.featuredSection.querySelector("[data-featured-open]").addEventListener("click", function(){ openRecipeOrBookmark(r); });
    renderMemoryBanner();
  }

  /* ---------------- souvenir culinaire ---------------- */
  function findMemoryRecipe(){
    var today = new Date();
    var matches = state.recipes.filter(function(r){
      if (!r.created_at) return false;
      var d = new Date(r.created_at);
      return d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && d.getFullYear() < today.getFullYear();
    });
    if (!matches.length) return null;
    matches.sort(function(a,b){ return new Date(a.created_at) - new Date(b.created_at); });
    return matches[0];
  }

  function renderMemoryBanner(){
    if (!els.memoryBanner) return;
    if (state.searchTerm.trim() || state.activeCategory !== TAB_ALL){ els.memoryBanner.hidden = true; return; }
    var r = findMemoryRecipe();
    if (!r){ els.memoryBanner.hidden = true; return; }
    var years = new Date().getFullYear() - new Date(r.created_at).getFullYear();
    var photoHtml = r.photo_url ? '<img src="' + esc(r.photo_url) + '" alt="">' : '<span class="ph-fallback">' + esc(initialsWord(r.title)) + '</span>';
    els.memoryBanner.innerHTML =
      '<div class="memory-photo">' + photoHtml + '</div>' +
      '<div class="memory-text">' +
        '<p class="memory-kicker">📸 Souvenir culinaire</p>' +
        '<p class="memory-line">Il y a ' + years + ' an' + (years > 1 ? 's' : '') + ' aujourd\'hui, votre famille ajoutait <b>' + esc(r.title) + '</b>' + (r.author ? ' (par ' + esc(r.author) + ')' : '') + '.</p>' +
        (r.story ? '<p class="memory-story hand">« ' + esc(r.story) + ' »</p>' : '') +
        '<button class="btn" data-memory-open type="button">Revoir la recette</button>' +
      '</div>';
    els.memoryBanner.hidden = false;
    els.memoryBanner.querySelector("[data-memory-open]").addEventListener("click", function(){ openRecipeOrBookmark(r); });
  }

  /* ---------------- detail sheet ---------------- */
  function findRecipe(id){
    return state.recipes.filter(function(r){ return r.id === id; })[0];
  }

  function openRecipeOrBookmark(r){
    if (r.is_bookmark && r.source_url){
      window.open(r.source_url, "_blank", "noopener");
      return;
    }
    openDetail(r.id);
  }

  function openDetail(id){
    var r = findRecipe(id);
    if (!r) return;
    var photoBlock = r.photo_url ? '<img class="detail-photo" src="' + esc(r.photo_url) + '" alt="">' : "";
    var currentServings = r.servings || null;

    var ingHtml = (r.ingredients||[]).map(function(i,idx){ return '<li><label class="ing-check"><input type="checkbox" data-ing-idx="' + idx + '"><span>' + esc(i) + '</span></label></li>'; }).join("");
    var stepHtml = (r.steps||[]).map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("");
    var servingsAdjustHtml = r.servings
      ? '<div class="servings-adjust">' +
          '<span class="lbl">Ajuster les portions pour l\'affichage</span>' +
          '<div class="servings-stepper">' +
            '<button type="button" data-serv-minus aria-label="Moins">−</button>' +
            '<span id="detailServingsVal" class="mono">' + r.servings + '</span>' +
            '<button type="button" data-serv-plus aria-label="Plus">+</button>' +
          '</div>' +
        '</div>'
      : '';

    var sourceHtml = r.source_url
      ? (/^https?:\/\//i.test(r.source_url)
          ? '<p class="detail-source">Provenance : <a href="' + esc(r.source_url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.source_url) + ' ↗</a></p>'
          : '<p class="detail-source">Provenance : ' + esc(r.source_url) + '</p>')
      : '';

    var isPublic = r.visibility === "public";
    var isPersonal = r.visibility === "personal";
    var actionsHtml = state.session
      ? '<div class="detail-actions">' +
          '<button class="btn" data-edit type="button">Modifier</button>' +
          '<button class="btn" data-add-planner type="button">📅 Ajouter au planificateur</button>' +
          (!isPersonal ? '<button class="btn" data-toggle-visibility type="button">' + (isPublic ? "🔒 Rendre privée" : "🌐 Rendre publique") + '</button>' : '') +
          '<button class="btn btn-danger" data-delete type="button">Supprimer</button>' +
        '</div>'
      : '<p class="signed-out-note">Connecte-toi pour modifier ou supprimer cette recette.</p>';
    var visibilityNote = isPublic
      ? '<p class="detail-visibility-note">🌐 Cette recette est visible par toutes les familles dans l\'onglet Découvrir.</p>'
      : (isPersonal ? '<p class="detail-visibility-note">🙈 Cette recette est personnelle — seul(e) toi la vois, même les autres membres de ta famille ne la voient pas. Change ça dans « Modifier » si tu veux la partager.</p>' : '');

    var tagsHtml = (r.tags && r.tags.length)
      ? '<div class="detail-tags">' + r.tags.map(function(t){ return '<span class="tag-pill">' + esc(t) + '</span>'; }).join("") + '</div>'
      : '';

    els.detailSheet.innerHTML =
      photoBlock +
      '<div class="sheet-head" style="padding-top:' + (r.photo_url ? '14px' : '20px') + ';">' +
        '<button type="button" class="detail-fav" data-fav aria-label="Favori" aria-pressed="' + (!!state.favorites[r.id]) + '">' + heartIcon(!!state.favorites[r.id]) + '</button>' +
        '<button class="sheet-close" data-close type="button">&times;</button>' +
      '</div>' +
      '<div class="detail-body">' +
        (r.story ? '<p class="detail-story">' + esc(r.story) + '</p>' : '') +
        '<p class="detail-cat">' + esc(r.category || "Autre") + '</p>' +
        '<h2 class="detail-title display">' + esc(r.title) + '</h2>' +
        (r.author ? '<p class="detail-author">Ajouté par ' + esc(r.author) + '</p>' : '') +
        tagsHtml +
        '<div class="detail-stats">' +
          (r.prep_min ? '<div class="stat"><span class="num mono">' + num(r.prep_min) + ' min</span><span class="lbl">Préparation</span></div>' : '') +
          (r.cook_min ? '<div class="stat"><span class="num mono">' + num(r.cook_min) + ' min</span><span class="lbl">Cuisson</span></div>' : '') +
          (r.servings ? '<div class="stat"><span class="num mono">' + num(r.servings) + '</span><span class="lbl">Portions</span></div>' : '') +
        '</div>' +
        '<button type="button" class="btn btn-primary cook-btn" data-cook>👩‍🍳 Mode cuisine</button>' +
        servingsAdjustHtml +
        '<div class="detail-cols">' +
          '<div><p class="detail-h">Ingrédients</p><ul class="ing-list" id="detailIngList">' + ingHtml + '</ul></div>' +
          '<div><p class="detail-h">Étapes</p><ol class="step-list">' + stepHtml + '</ol></div>' +
        '</div>' +
        sourceHtml +
        visibilityNote +
        actionsHtml +
        commentsBlockHtml() +
      '</div>';

    els.detailSheet.querySelector("[data-close]").addEventListener("click", closeDetail);
    els.detailSheet.querySelector("[data-fav]").addEventListener("click", function(){ toggleFavorite(r.id); });
    els.detailSheet.querySelector("[data-cook]").addEventListener("click", function(){ openCookMode(r); });
    var editBtn = els.detailSheet.querySelector("[data-edit]");
    var delBtn = els.detailSheet.querySelector("[data-delete]");
    var visBtn = els.detailSheet.querySelector("[data-toggle-visibility]");
    var addPlannerBtn = els.detailSheet.querySelector("[data-add-planner]");
    if (addPlannerBtn) addPlannerBtn.addEventListener("click", function(){ openAddToPlanner(r, currentServings); });
    if (r.servings){
      var baseServings = r.servings;
      var minusBtn = els.detailSheet.querySelector("[data-serv-minus]");
      var plusBtn = els.detailSheet.querySelector("[data-serv-plus]");
      var valEl = els.detailSheet.querySelector("#detailServingsVal");
      var refreshScaledIngredients = function(){
        var ratio = currentServings / baseServings;
        var listEl = els.detailSheet.querySelector("#detailIngList");
        if (listEl){
          listEl.innerHTML = (r.ingredients||[]).map(function(i,idx){
            return '<li><label class="ing-check"><input type="checkbox" data-ing-idx="' + idx + '"><span>' + esc(scaleIngredientText(i, ratio)) + '</span></label></li>';
          }).join("");
        }
        if (valEl) valEl.textContent = currentServings;
      };
      if (minusBtn) minusBtn.addEventListener("click", function(){ if (currentServings > 1){ currentServings--; refreshScaledIngredients(); } });
      if (plusBtn) plusBtn.addEventListener("click", function(){ currentServings++; refreshScaledIngredients(); });
    }
    if (editBtn) editBtn.addEventListener("click", function(){ closeDetail(); openForm(r); });
    if (visBtn) visBtn.addEventListener("click", function(){
      if (!supabase) return;
      var newVisibility = isPublic ? "private" : "public";
      supabase.from("recipes").update({ visibility: newVisibility }).eq("id", r.id).then(function(res){
        if (res.error){ toast("Impossible de changer la visibilité — " + res.error.message); return; }
        toast(newVisibility === "public" ? "Recette rendue publique." : "Recette rendue privée.");
        closeDetail();
      });
    });
    if (delBtn) delBtn.addEventListener("click", function(){
      state.deleteTargetId = r.id;
      els.confirmOverlay.hidden = false;
    });
    renderComments(r.id);
    wireCommentForm(r.id);

    els.detailOverlay.hidden = false;
    state.openRecipeId = r.id;
  }
  function closeDetail(){ els.detailOverlay.hidden = true; els.detailSheet.innerHTML = ""; state.openRecipeId = null; }
  els.detailOverlay.addEventListener("click", function(e){ if (e.target === els.detailOverlay) closeDetail(); });

  /* ---------------- favoris ---------------- */
  function loadFavorites(){
    if (!supabase || !state.session){ state.favorites = {}; renderGrid(); renderFeatured(); return; }
    supabase.from("favorites").select("recipe_id").eq("user_id", state.session.user.id).then(function(res){
      if (res.error) return;
      var map = {};
      (res.data || []).forEach(function(row){ map[row.recipe_id] = true; });
      state.favorites = map;
      renderGrid();
      renderFeatured();
    });
  }

  function toggleFavorite(id){
    if (!state.session){ openAuth("login"); return; }
    var wasFav = !!state.favorites[id];
    if (wasFav){
      delete state.favorites[id];
    } else {
      state.favorites[id] = true;
    }
    renderGrid();
    renderFeatured();
    if (!els.detailOverlay.hidden){
      var favBtn = els.detailSheet.querySelector("[data-fav]");
      if (favBtn){
        favBtn.innerHTML = heartIcon(!wasFav);
        favBtn.setAttribute("aria-pressed", String(!wasFav));
      }
    }
    var query = wasFav
      ? supabase.from("favorites").delete().eq("user_id", state.session.user.id).eq("recipe_id", id)
      : supabase.from("favorites").insert({ user_id: state.session.user.id, recipe_id: id });
    query.then(function(res){
      if (res.error){
        if (wasFav) state.favorites[id] = true; else delete state.favorites[id];
        renderGrid();
        renderFeatured();
        toast("Le favori n'a pas pu être sauvegardé.");
      }
    });
  }

  /* ---------------- commentaires ---------------- */
  function commentsBlockHtml(){
    return '<div class="comments-section">' +
      '<p class="detail-h">Commentaires</p>' +
      '<div class="comments-list" id="commentsList"><p class="hint">Chargement…</p></div>' +
      (state.session
        ? '<form class="comment-form" id="commentForm"><textarea id="commentText" placeholder="Écris un commentaire…" required></textarea><button type="submit" class="btn btn-primary">Publier</button></form>'
        : '<p class="hint">Connecte-toi pour laisser un commentaire.</p>') +
    '</div>';
  }

  function renderComments(recipeId){
    if (!supabase) return;
    supabase.from("comments").select("*").eq("recipe_id", recipeId).order("created_at", { ascending: true }).then(function(res){
      var listEl = els.detailSheet.querySelector("#commentsList");
      if (!listEl) return;
      if (res.error){ listEl.innerHTML = '<p class="hint">Impossible de charger les commentaires.</p>'; return; }
      var rows = res.data || [];
      listEl.innerHTML = rows.length
        ? rows.map(function(c){
            return '<div class="comment-item"><p class="comment-author">' + esc(c.author || "Anonyme") + '</p><p class="comment-body">' + esc(c.body) + '</p></div>';
          }).join("")
        : '<p class="hint">Aucun commentaire pour l\'instant — sois le premier !</p>';
    });
  }

  function wireCommentForm(recipeId){
    var form = els.detailSheet.querySelector("#commentForm");
    if (!form) return;
    form.addEventListener("submit", function(e){
      e.preventDefault();
      if (!supabase || !state.session) return;
      var textEl = els.detailSheet.querySelector("#commentText");
      var body = textEl.value.trim();
      if (!body) return;
      supabase.from("comments").insert({
        recipe_id: recipeId,
        user_id: state.session.user.id,
        author: displayName(state.session),
        body: body
      }).then(function(res){
        if (res.error){ toast("Le commentaire n'a pas pu être publié — " + res.error.message); return; }
        textEl.value = "";
        renderComments(recipeId);
      });
    });
  }

  /* ---------------- mode cuisine ---------------- */
  var cookState = { recipe: null, index: 0, checkedIng: {} };
  var cookTimer = { remaining: 0, intervalId: null };

  function formatTimer(s){
    s = Math.max(0, s);
    var m = Math.floor(s / 60), sec = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
  }
  function updateTimerDisplay(){
    var d = els.cookSheet.querySelector("#cookTimerDisplay");
    if (d) d.textContent = formatTimer(cookTimer.remaining);
    d && d.classList.toggle("done", cookTimer.remaining === 0 && cookTimer.wasStarted);
  }
  function playTimerSound(){
    try{
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.3, 0.6].forEach(function(delay){
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.25, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
        o.start(ctx.currentTime + delay);
        o.stop(ctx.currentTime + delay + 0.26);
      });
    } catch(e){}
  }
  function setTimerToggleLabel(){
    var btn = els.cookSheet.querySelector("[data-timer-toggle]");
    if (btn) btn.textContent = cookTimer.intervalId ? "⏸ Pause" : "▶ Démarrer";
  }
  function toggleCookTimer(){
    if (cookTimer.intervalId){
      clearInterval(cookTimer.intervalId);
      cookTimer.intervalId = null;
    } else {
      if (cookTimer.remaining <= 0) return;
      cookTimer.wasStarted = true;
      cookTimer.intervalId = setInterval(function(){
        cookTimer.remaining--;
        updateTimerDisplay();
        if (cookTimer.remaining <= 0){
          clearInterval(cookTimer.intervalId);
          cookTimer.intervalId = null;
          setTimerToggleLabel();
          playTimerSound();
          toast("⏰ Minuteur terminé !");
        }
      }, 1000);
    }
    setTimerToggleLabel();
  }
  function resetCookTimer(){
    clearInterval(cookTimer.intervalId);
    cookTimer.intervalId = null;
    cookTimer.remaining = 0;
    cookTimer.wasStarted = false;
    updateTimerDisplay();
    setTimerToggleLabel();
  }
  function wireCookTimer(){
    els.cookSheet.querySelectorAll("[data-timer-add]").forEach(function(b){
      b.addEventListener("click", function(){
        cookTimer.remaining += Number(b.getAttribute("data-timer-add"));
        updateTimerDisplay();
      });
    });
    var toggleBtn = els.cookSheet.querySelector("[data-timer-toggle]");
    if (toggleBtn) toggleBtn.addEventListener("click", toggleCookTimer);
    var resetBtn = els.cookSheet.querySelector("[data-timer-reset]");
    if (resetBtn) resetBtn.addEventListener("click", resetCookTimer);
  }

  function cookIngredientsHtml(){
    var r = cookState.recipe;
    var ingredients = (r && r.ingredients) || [];
    var itemsHtml = ingredients.map(function(ing, idx){
      var checked = !!cookState.checkedIng[idx];
      return '<li><label class="ing-check"><input type="checkbox" data-cook-ing-idx="' + idx + '"' + (checked ? ' checked' : '') + '><span>' + esc(ing) + '</span></label></li>';
    }).join("");
    return '<div class="cook-ingredients">' +
      '<p class="cook-ingredients-title">🧺 Ingrédients</p>' +
      '<ul class="ing-list">' + itemsHtml + '</ul>' +
    '</div>';
  }
  function wireCookIngredients(){
    els.cookSheet.querySelectorAll("[data-cook-ing-idx]").forEach(function(cb){
      cb.addEventListener("change", function(){
        cookState.checkedIng[cb.getAttribute("data-cook-ing-idx")] = cb.checked;
      });
    });
  }

  function renderCook(){
    var r = cookState.recipe;
    if (!r) return;
    var steps = r.steps || [];
    var i = cookState.index;
    var total = steps.length;
    els.cookSheet.innerHTML =
      '<div class="cook-layout">' +
        cookIngredientsHtml() +
        '<div class="cook-main">' +
          '<div class="cook-head">' +
            '<span class="cook-title">' + esc(r.title) + '</span>' +
            '<button class="sheet-close" data-cook-close type="button">&times;</button>' +
          '</div>' +
          '<div class="cook-progress">Étape ' + (i + 1) + ' / ' + total + '</div>' +
          '<div class="cook-step">' + esc(steps[i] || "") + '</div>' +
          '<div class="cook-timer">' +
            '<span class="cook-timer-display" id="cookTimerDisplay">' + formatTimer(cookTimer.remaining) + '</span>' +
            '<div class="cook-timer-controls">' +
              '<button class="btn" data-timer-add="60" type="button">+1 min</button>' +
              '<button class="btn" data-timer-add="300" type="button">+5 min</button>' +
              '<button class="btn btn-primary" data-timer-toggle type="button">' + (cookTimer.intervalId ? "⏸ Pause" : "▶ Démarrer") + '</button>' +
              '<button class="btn" data-timer-reset type="button">↺</button>' +
            '</div>' +
          '</div>' +
          '<div class="cook-nav">' +
            '<button class="btn" data-cook-prev type="button"' + (i === 0 ? ' disabled' : '') + '>← Précédent</button>' +
            (i < total - 1
              ? '<button class="btn btn-primary" data-cook-next type="button">Suivant →</button>'
              : '<button class="btn btn-primary" data-cook-done type="button">Terminé ✓</button>') +
          '</div>' +
        '</div>' +
      '</div>';

    els.cookSheet.querySelector("[data-cook-close]").addEventListener("click", closeCookMode);
    wireCookTimer();
    wireCookIngredients();
    var prevBtn = els.cookSheet.querySelector("[data-cook-prev]");
    if (prevBtn) prevBtn.addEventListener("click", function(){ if (cookState.index > 0){ cookState.index--; renderCook(); } });
    var nextBtn = els.cookSheet.querySelector("[data-cook-next]");
    if (nextBtn) nextBtn.addEventListener("click", function(){ if (cookState.index < total - 1){ cookState.index++; renderCook(); } });
    var doneBtn = els.cookSheet.querySelector("[data-cook-done]");
    if (doneBtn) doneBtn.addEventListener("click", closeCookMode);
  }

  function openCookMode(r){
    if (!r.steps || !r.steps.length) return;
    cookState.recipe = r;
    cookState.index = 0;
    cookState.checkedIng = {};
    renderCook();
    els.cookOverlay.hidden = false;
  }
  function closeCookMode(){
    els.cookOverlay.hidden = true;
    els.cookSheet.innerHTML = "";
    cookState.recipe = null;
  }
  els.cookOverlay.addEventListener("click", function(e){ if (e.target === els.cookOverlay) closeCookMode(); });

  /* ---------------- ajouter au planificateur (depuis une fiche recette) ---------------- */
  var pendingPlannerRecipe = null;
  function openAddToPlanner(recipe, defaultServings){
    if (!state.session){ openAuth("login"); return; }
    if (!state.familyId) return;
    pendingPlannerRecipe = recipe;
    var daySel = els["atp-day"];
    daySel.innerHTML = "";
    var today = new Date();
    for (var i = 0; i < 21; i++){
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      var opt = document.createElement("option");
      opt.value = isoDate(d);
      var dayName = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][d.getDay()];
      opt.textContent = (i === 0 ? "Aujourd'hui — " : i === 1 ? "Demain — " : "") + dayName + " " + d.getDate() + " " + MONTH_SHORT[d.getMonth()];
      daySel.appendChild(opt);
    }
    els["atp-servings"].value = defaultServings || recipe.servings || "";
    els.addToPlannerOverlay.hidden = false;
  }
  function closeAddToPlanner(){ els.addToPlannerOverlay.hidden = true; pendingPlannerRecipe = null; }
  els.addToPlannerClose.addEventListener("click", closeAddToPlanner);
  els.atpCancel.addEventListener("click", closeAddToPlanner);
  els.addToPlannerOverlay.addEventListener("click", function(e){ if (e.target === els.addToPlannerOverlay) closeAddToPlanner(); });
  els.atpConfirm.addEventListener("click", function(){
    if (!pendingPlannerRecipe) return;
    var dateIso = els["atp-day"].value;
    var slot = els["atp-slot"].value;
    var servings = Number(els["atp-servings"].value) || null;
    assignMeal(dateIso, slot, pendingPlannerRecipe.id, servings, false);
    closeAddToPlanner();
    toast("Ajouté au planificateur — vérifie l'onglet Planifier.");
  });

  /* ---------------- signaler une recette publique ---------------- */
  var pendingReportRecipeId = null;
  function openReportOverlay(recipeId){
    if (!state.session){ openAuth("login"); return; }
    pendingReportRecipeId = recipeId;
    els["report-reason"].value = "";
    els.reportError.hidden = true;
    els.reportOverlay.hidden = false;
  }
  function closeReportOverlay(){ els.reportOverlay.hidden = true; pendingReportRecipeId = null; }
  els.reportClose.addEventListener("click", closeReportOverlay);
  els.reportCancel.addEventListener("click", closeReportOverlay);
  els.reportOverlay.addEventListener("click", function(e){ if (e.target === els.reportOverlay) closeReportOverlay(); });
  els.reportConfirm.addEventListener("click", function(){
    if (!supabase || !pendingReportRecipeId || !state.session) return;
    var reason = els["report-reason"].value.trim();
    if (!reason){
      els.reportError.textContent = "Explique brièvement la raison du signalement.";
      els.reportError.hidden = false;
      return;
    }
    supabase.from("recipe_reports").insert({
      recipe_id: pendingReportRecipeId,
      reported_by: state.session.user.id,
      reason: reason
    }).then(function(res){
      if (res.error){
        els.reportError.textContent = "Le signalement n'a pas pu être envoyé — " + res.error.message;
        els.reportError.hidden = false;
        return;
      }
      closeReportOverlay();
      toast("Signalement envoyé — merci, on va vérifier.");
    });
  });

  /* ================= PROFIL DE FAMILLE (parcourir) ================= */

  var currentProfileFamily = null;

  function openFamilyProfile(familyId, familyName, familyRegion, isAdminFamily){
    currentProfileFamily = { id: familyId, name: familyName, region: familyRegion };
    els.familyProfileHeading.innerHTML = "👪 " + esc(familyName) + (isAdminFamily === "true" || isAdminFamily === true ? ' <span class="fam-verified-badge" title="Famille officielle">✅ Officielle</span>' : '');
    els.familyProfileRegion.textContent = familyRegion ? "📍 " + familyRegion : "";
    if (els.familyProfileFollowers) els.familyProfileFollowers.textContent = "";
    els.familyProfileList.innerHTML = '<p class="hint">Chargement…</p>';
    els.familyProfileOverlay.hidden = false;
    renderFollowBtn(familyId);
    refreshFamilyProfileFollowerCount(familyId);

    supabase.from("recipes_browse").select("*").eq("family_id", familyId).then(function(res){
      if (res.error){ els.familyProfileList.innerHTML = '<p class="hint">Impossible de charger les recettes.</p>'; return; }
      var list = sortByDate(res.data || []);
      if (!list.length){ els.familyProfileList.innerHTML = '<p class="hint">Aucune recette publique ou visible pour l\'instant — tu peux quand même envoyer une demande générale ci-dessus.</p>'; return; }
      els.familyProfileList.innerHTML = list.map(function(r){
        var isPublic = r.visibility === "public";
        var mine = state.recipes.some(function(mr){ return mr.id === r.id; });
        var unlocked = isPublic || mine;
        return '<div class="browse-recipe-row' + (unlocked ? '' : ' locked') + '">' +
          '<span class="browse-title">' + (unlocked ? '' : (r.visibility === "personal" ? '🙈 ' : '🔒 ')) + esc(r.title) + (r.is_bookmark ? ' 🔗' : '') + '</span>' +
          '<span class="browse-meta">' + esc(r.category || "") + '</span>' +
          (unlocked
            ? '<button type="button" class="btn" data-browse-open="' + r.id + '" data-browse-public="' + isPublic + '" data-browse-bookmark="' + (r.is_bookmark ? esc(r.source_url || "") : "") + '">Voir</button>'
            : '<button type="button" class="btn" data-browse-request="' + r.id + '" data-browse-title="' + esc(r.title) + '" data-browse-personal="' + (r.visibility === "personal") + '" data-browse-creator="' + (r.created_by || "") + '">Demander l\'accès</button>') +
        '</div>';
      }).join("");

      els.familyProfileList.querySelectorAll("[data-browse-open]").forEach(function(btn){
        btn.addEventListener("click", function(){
          var id = btn.getAttribute("data-browse-open");
          var bookmarkUrl = btn.getAttribute("data-browse-bookmark");
          if (bookmarkUrl){ window.open(bookmarkUrl, "_blank", "noopener"); return; }
          els.familyProfileOverlay.hidden = true;
          if (btn.getAttribute("data-browse-public") === "true") openDiscoverDetail(id);
          else openDetail(id);
        });
      });
      els.familyProfileList.querySelectorAll("[data-browse-request]").forEach(function(btn){
        btn.addEventListener("click", function(){
          var isPersonal = btn.getAttribute("data-browse-personal") === "true";
          var creatorId = btn.getAttribute("data-browse-creator");
          openRequestAccess(btn.getAttribute("data-browse-request"), btn.getAttribute("data-browse-title"), familyId, isPersonal ? creatorId : null);
        });
      });
    });
  }
  els.familyProfileClose.addEventListener("click", function(){ els.familyProfileOverlay.hidden = true; });
  els.familyProfileOverlay.addEventListener("click", function(e){ if (e.target === els.familyProfileOverlay) els.familyProfileOverlay.hidden = true; });
  if (els.familyGeneralRequestBtn){
    els.familyGeneralRequestBtn.addEventListener("click", function(){
      if (!currentProfileFamily) return;
      openRequestAccess(null, "Demande générale à " + currentProfileFamily.name, currentProfileFamily.id);
    });
  }

  /* ================= S'ABONNER À UNE FAMILLE ================= */

  function loadFollowedFamilies(){
    if (!supabase || !state.session) return;
    supabase.from("family_follows").select("followed_family_id").eq("follower_user_id", state.session.user.id).then(function(res){
      if (res.error) return;
      state.followedFamilyIds = (res.data || []).map(function(row){ return row.followed_family_id; });
      if (state.view === "discover") loadFollowedRecipes();
    });
  }

  function renderFollowBtn(familyId){
    if (!els.familyFollowBtn) return;
    if (familyId === state.familyId){ els.familyFollowBtn.hidden = true; return; }
    els.familyFollowBtn.hidden = false;
    var following = state.followedFamilyIds.indexOf(familyId) !== -1;
    els.familyFollowBtn.textContent = following ? "✅ Abonné(e) — Se désabonner" : "⭐ S'abonner à cette famille";
    els.familyFollowBtn.classList.toggle("following", following);
  }
  if (els.familyFollowBtn){
    els.familyFollowBtn.addEventListener("click", function(){
      if (!supabase || !currentProfileFamily || !state.session) return;
      var familyId = currentProfileFamily.id;
      var following = state.followedFamilyIds.indexOf(familyId) !== -1;
      if (following){
        supabase.from("family_follows").delete().eq("follower_user_id", state.session.user.id).eq("followed_family_id", familyId).then(function(res){
          if (res.error){ toast("Impossible de se désabonner."); return; }
          state.followedFamilyIds = state.followedFamilyIds.filter(function(id){ return id !== familyId; });
          renderFollowBtn(familyId);
          loadFollowedRecipes();
          loadFollowedFamilies();
          refreshFamilyProfileFollowerCount(familyId);
          toast("Désabonné(e) de " + currentProfileFamily.name + ".");
        });
      } else {
        supabase.from("family_follows").insert({ follower_user_id: state.session.user.id, followed_family_id: familyId }).then(function(res){
          if (res.error){ toast("Impossible de s'abonner."); return; }
          state.followedFamilyIds.push(familyId);
          renderFollowBtn(familyId);
          loadFollowedRecipes();
          loadFollowedFamilies();
          refreshFamilyProfileFollowerCount(familyId);
          toast("Abonné(e) à " + currentProfileFamily.name + " !");
        });
      }
    });
  }

  function refreshFamilyProfileFollowerCount(familyId){
    if (!els.familyProfileFollowers || !supabase) return;
    supabase.rpc("search_families", { query: currentProfileFamily ? currentProfileFamily.name : "" }).then(function(res){
      if (res.error || !res.data) return;
      var match = res.data.filter(function(f){ return f.id === familyId; })[0];
      if (match) els.familyProfileFollowers.textContent = "⭐ " + match.follower_count + " abonné(e)" + (match.follower_count > 1 ? "s" : "");
    });
  }

  function openMyFollowsList(){
    els.myFollowsOverlay.hidden = false;
    els.myFollowsList.innerHTML = '<p class="hint">Chargement…</p>';
    if (!state.followedFamilyIds.length){
      els.myFollowsList.innerHTML = '<p class="hint">Tu ne suis encore aucune famille — trouve-en une dans Découvrir !</p>';
      return;
    }
    supabase.rpc("search_families", { query: "" }).then(function(res){
      if (res.error){ els.myFollowsList.innerHTML = '<p class="hint">Impossible de charger.</p>'; return; }
      var rows = (res.data || []).filter(function(f){ return state.followedFamilyIds.indexOf(f.id) !== -1; });
      if (!rows.length){ els.myFollowsList.innerHTML = '<p class="hint">Tu ne suis encore aucune famille.</p>'; return; }
      els.myFollowsList.innerHTML =
        '<p class="hint" style="margin:0 0 12px;">Tu suis ' + rows.length + ' famille' + (rows.length > 1 ? 's' : '') + '.</p>' +
        rows.map(function(f){
        return '<div class="fam-result-row">' +
          '<div><span class="fam-result-name">👪 ' + esc(f.name) + '</span>' +
          (f.is_admin_family ? ' <span class="fam-verified-badge">✅ Officielle</span>' : '') +
          (f.region ? ' <span class="fam-result-region">📍 ' + esc(f.region) + '</span>' : '') + '</div>' +
          '<button type="button" class="btn" data-myfollow-open="' + f.id + '" data-myfollow-name="' + esc(f.name) + '" data-myfollow-region="' + esc(f.region || "") + '" data-myfollow-admin="' + !!f.is_admin_family + '">Voir</button>' +
        '</div>';
      }).join("");
      els.myFollowsList.querySelectorAll("[data-myfollow-open]").forEach(function(btn){
        btn.addEventListener("click", function(){
          els.myFollowsOverlay.hidden = true;
          openFamilyProfile(btn.getAttribute("data-myfollow-open"), btn.getAttribute("data-myfollow-name"), btn.getAttribute("data-myfollow-region"), btn.getAttribute("data-myfollow-admin"));
        });
      });
    });
  }
  if (els.myFollowsBellBtn) els.myFollowsBellBtn.addEventListener("click", openMyFollowsList);
  if (els.myFollowsClose) els.myFollowsClose.addEventListener("click", function(){ els.myFollowsOverlay.hidden = true; });
  if (els.myFollowsOverlay) els.myFollowsOverlay.addEventListener("click", function(e){ if (e.target === els.myFollowsOverlay) els.myFollowsOverlay.hidden = true; });

  function loadFollowedRecipes(){
    if (!supabase || !els.followedSection) return;
    if (!state.followedFamilyIds.length){ els.followedSection.hidden = true; return; }
    supabase.from("recipes").select("*, families(name)")
      .in("family_id", state.followedFamilyIds)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(function(res){
        if (res.error || !res.data || !res.data.length){ els.followedSection.hidden = true; return; }
        state.followedRecipesCache = res.data;
        els.followedSection.hidden = false;
        els.followedSection.innerHTML =
          '<p class="followed-section-title">⭐ Nouveautés de vos familles suivies</p>' +
          '<div class="followed-list">' +
            res.data.map(function(r){
              var photoHtml = r.photo_url ? '<img src="' + esc(r.photo_url) + '" alt="">' : '<span class="ph-fallback">' + esc(initialsWord(r.title)) + '</span>';
              return '<div class="followed-item" data-followed-open="' + r.id + '">' +
                photoHtml +
                '<div class="followed-item-body">' +
                  '<p class="followed-item-title">' + esc(r.title) + '</p>' +
                  '<p class="followed-item-fam">👪 ' + esc(r.families ? r.families.name : "") + '</p>' +
                '</div>' +
              '</div>';
            }).join("") +
          '</div>';
        els.followedSection.querySelectorAll("[data-followed-open]").forEach(function(el){
          el.addEventListener("click", function(){ openDiscoverDetail(el.getAttribute("data-followed-open")); });
        });
      });
  }

  /* ================= ONGLET "RECETTES QUÉBÉCOISES" — signets partagés par toutes les familles ================= */

  var quebecBookmarksCache = [];
  function loadQuebecBookmarks(){
    if (!supabase) return;
    supabase.from("recipes").select("*, families(name, region)")
      .eq("is_bookmark", true)
      .eq("visibility", "private")
      .order("created_at", { ascending: false })
      .then(function(res){
        if (res.error) return;
        quebecBookmarksCache = res.data || [];
        renderQuebecGrid();
      });
  }
  function renderQuebecGrid(){
    if (!els.quebecGrid) return;
    var list = quebecBookmarksCache.slice();
    if (state.quebecMapRegion) list = list.filter(function(r){ return r.families && r.families.region === state.quebecMapRegion; });
    els.quebecGrid.innerHTML = "";
    if (!list.length){
      els.quebecGrid.hidden = true;
      els.quebecEmptyState.hidden = false;
      return;
    }
    els.quebecEmptyState.hidden = true;
    els.quebecGrid.hidden = false;
    list.forEach(function(r){
      var card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      var photoHtml = r.photo_url
        ? '<img src="' + esc(r.photo_url) + '" alt="" loading="lazy">'
        : '<span class="ph-fallback">' + esc(initialsWord(r.title)) + '</span>';
      var famName = r.families ? r.families.name : "Famille inconnue";
      var famRegion = r.families && r.families.region ? " · 📍 " + esc(r.families.region) : "";
      var tagsHtml = (r.tags && r.tags.length)
        ? '<div class="tag-row">' + r.tags.slice(0,3).map(function(t){ return '<span class="tag-pill">' + esc(t) + '</span>'; }).join("") + '</div>'
        : '';
      card.innerHTML =
        '<div class="card-photo">' + photoHtml + '</div>' +
        '<div class="card-body">' +
          '<p class="card-cat">' + esc(r.category || "Autre") + ' · 🔗 · <span class="fam-link" data-fam-link>👪 ' + esc(famName) + '</span>' + famRegion + '</p>' +
          '<h3 class="card-title">' + esc(r.title) + '</h3>' +
          tagsHtml +
        '</div>';
      card.addEventListener("click", function(){ window.open(r.source_url, "_blank", "noopener"); });
      card.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); window.open(r.source_url, "_blank", "noopener"); } });
      card.style.setProperty("--cat-color", categoryColor(r.category));
      var famLink = card.querySelector("[data-fam-link]");
      if (famLink && r.family_id){
        famLink.addEventListener("click", function(e){
          e.stopPropagation();
          openFamilyProfile(r.family_id, famName, r.families ? r.families.region : "");
        });
      }
      els.quebecGrid.appendChild(card);
    });
  }

  function switchDiscoverSub(sub){
    state.discoverSubView = sub;
    document.querySelectorAll(".discover-subtab").forEach(function(b){
      b.classList.toggle("active", b.getAttribute("data-discover-sub") === sub);
    });
    if (els.discoverQuebecView) els.discoverQuebecView.hidden = sub !== "quebec";
    if (els.discoverTousView) els.discoverTousView.hidden = sub !== "tous";
    if (sub === "quebec"){
      renderQuebecMap();
      loadDiscoverSidebar();
      loadQuebecBookmarks();
      loadFollowedRecipes();
    } else {
      renderDiscoverFilters();
      renderDiscoverGrid();
      loadDiscoverRecipes();
    }
  }
  document.addEventListener("click", function(e){
    var btn = e.target.closest ? e.target.closest("[data-discover-sub]") : null;
    if (btn) switchDiscoverSub(btn.getAttribute("data-discover-sub"));
  });

  function renderFamilySearchResults(rows){
    if (!rows.length){ els.familySearchResults.innerHTML = '<p class="hint">Aucune famille trouvée avec ce nom.</p>'; return; }
    els.familySearchResults.innerHTML = rows.map(function(f){
      return '<div class="fam-result-row">' +
        '<div><span class="fam-result-name">👪 ' + esc(f.name) + '</span>' +
        (f.is_admin_family ? ' <span class="fam-verified-badge" title="Famille officielle">✅ Officielle</span>' : '') +
        (f.region ? ' <span class="fam-result-region">📍 ' + esc(f.region) + '</span>' : '') + '</div>' +
        '<button type="button" class="btn" data-fam-result="' + f.id + '" data-fam-result-name="' + esc(f.name) + '" data-fam-result-region="' + esc(f.region || "") + '" data-fam-result-admin="' + !!f.is_admin_family + '">Voir le profil</button>' +
      '</div>';
    }).join("");
    els.familySearchResults.querySelectorAll("[data-fam-result]").forEach(function(btn){
      btn.addEventListener("click", function(){
        openFamilyProfile(btn.getAttribute("data-fam-result"), btn.getAttribute("data-fam-result-name"), btn.getAttribute("data-fam-result-region"), btn.getAttribute("data-fam-result-admin"));
      });
    });
  }

  if (els.familyNameSearch){
    var famSearchTimeout = null;
    els.familyNameSearch.addEventListener("input", function(){
      var q = els.familyNameSearch.value.trim();
      clearTimeout(famSearchTimeout);
      if (!q){ els.familySearchResults.innerHTML = ""; return; }
      famSearchTimeout = setTimeout(function(){
        supabase.rpc("search_families", { query: q }).then(function(res){
          if (res.error){ els.familySearchResults.innerHTML = '<p class="hint">Recherche impossible.</p>'; return; }
          renderFamilySearchResults((res.data || []).filter(function(f){ return f.id !== state.familyId; }));
        });
      }, 300);
    });
  }

  var lastSidebarFamilies = [];
  function loadDiscoverSidebar(){
    if (!supabase || !els.discoverSidebarList) return;
    supabase.rpc("search_families", { query: "" }).then(function(res){
      if (res.error){ els.discoverSidebarList.innerHTML = '<p class="hint">Impossible de charger.</p>'; return; }
      lastSidebarFamilies = (res.data || []).filter(function(f){ return f.id !== state.familyId; });
      renderDiscoverSidebarList();
    });
  }
  function renderDiscoverSidebarList(){
    var rows = lastSidebarFamilies.slice();
    if (state.quebecMapRegion) rows = rows.filter(function(f){ return f.region === state.quebecMapRegion; });
    rows.sort(function(a,b){ return a.name.localeCompare(b.name); });
    if (!rows.length){
      els.discoverSidebarList.innerHTML = state.quebecMapRegion
        ? '<p class="hint">Aucune famille inscrite dans cette région pour l\'instant.</p>'
        : '<p class="hint">Aucune autre famille inscrite pour l\'instant.</p>';
      return;
    }
    els.discoverSidebarList.innerHTML = rows.map(function(f){
      return '<button type="button" class="discover-sidebar-item" data-sidebar-fam="' + f.id + '" data-sidebar-fam-name="' + esc(f.name) + '" data-sidebar-fam-region="' + esc(f.region || "") + '" data-sidebar-fam-admin="' + !!f.is_admin_family + '">' +
        '<span class="fam-result-name">👪 ' + esc(f.name) + (f.is_admin_family ? ' <span class="fam-verified-badge" title="Famille officielle">✅</span>' : '') + '</span>' +
        (f.region ? '<span class="fam-result-region">📍 ' + esc(f.region) + '</span>' : '') +
      '</button>';
    }).join("");
    els.discoverSidebarList.querySelectorAll("[data-sidebar-fam]").forEach(function(btn){
      btn.addEventListener("click", function(){
        openFamilyProfile(btn.getAttribute("data-sidebar-fam"), btn.getAttribute("data-sidebar-fam-name"), btn.getAttribute("data-sidebar-fam-region"), btn.getAttribute("data-sidebar-fam-admin"));
      });
    });
  }

  /* ================= CARTE INTERACTIVE DU QUÉBEC ================= */
  var QUEBEC_OUTLINE_PATH = "M 727.3,215.6 L 716.1,219.4 L 725.8,228.8 L 714.7,232.8 L 725.4,241.5 L 719.1,249.2 L 721.8,256.7 L 715.8,267.4 L 725.3,275.1 L 733.8,268.5 L 737.7,270.3 L 730.9,284.9 L 733.2,298.6 L 741.8,304.8 L 734.5,307.1 L 723.4,301.6 L 719.8,310.6 L 741.1,312.7 L 747.6,323.0 L 760.2,312.6 L 771.8,320.3 L 751.2,325.8 L 749.5,335.3 L 752.4,338.1 L 758.1,334.8 L 760.5,340.6 L 748.1,349.5 L 739.3,368.2 L 747.5,372.5 L 754.1,390.4 L 759.9,388.2 L 769.3,398.0 L 772.0,391.9 L 766.1,402.3 L 769.7,417.5 L 763.4,424.8 L 763.7,430.0 L 768.9,427.0 L 763.9,437.7 L 766.1,452.4 L 760.6,453.6 L 755.9,465.1 L 767.3,482.7 L 756.0,484.2 L 759.9,495.3 L 768.6,497.9 L 762.5,502.8 L 763.1,508.7 L 769.5,503.5 L 770.7,509.7 L 785.8,510.0 L 770.9,518.9 L 778.4,527.2 L 775.3,536.9 L 779.9,537.3 L 775.2,549.5 L 793.7,555.3 L 780.4,563.5 L 791.4,563.7 L 784.2,572.9 L 785.5,588.9 L 776.0,586.3 L 776.8,595.1 L 773.0,597.8 L 781.9,607.5 L 774.1,610.1 L 766.1,609.5 L 762.9,602.6 L 753.7,598.4 L 747.7,603.7 L 739.2,603.3 L 738.6,596.0 L 725.7,587.3 L 717.6,598.2 L 709.9,597.5 L 711.4,604.7 L 701.5,606.1 L 695.1,591.5 L 679.2,588.6 L 656.4,562.9 L 661.7,574.7 L 658.3,572.7 L 657.3,579.6 L 663.9,588.2 L 658.5,587.5 L 665.1,600.7 L 659.7,600.6 L 662.6,607.6 L 647.8,597.2 L 638.4,583.0 L 630.2,583.9 L 646.5,610.5 L 638.3,616.7 L 638.7,623.4 L 630.0,617.0 L 629.5,624.0 L 623.4,622.3 L 618.5,627.5 L 624.9,644.3 L 617.6,648.3 L 616.7,656.4 L 630.2,669.3 L 626.0,674.2 L 633.5,676.7 L 638.2,689.0 L 649.6,690.1 L 655.7,698.2 L 650.1,703.7 L 651.9,720.8 L 640.1,714.5 L 635.3,718.3 L 636.4,727.3 L 641.2,728.6 L 637.8,734.8 L 645.2,739.5 L 649.1,735.6 L 650.8,744.2 L 658.3,749.2 L 658.0,742.8 L 662.2,749.5 L 661.1,740.9 L 666.8,741.4 L 667.3,729.9 L 672.8,729.9 L 674.2,722.7 L 678.1,724.5 L 683.1,735.0 L 676.5,736.4 L 682.7,751.7 L 677.9,748.4 L 675.9,751.9 L 680.5,770.1 L 674.5,772.5 L 679.6,785.0 L 684.3,784.8 L 683.9,774.0 L 696.2,791.4 L 709.7,786.5 L 711.2,795.4 L 717.2,786.8 L 723.4,795.2 L 724.3,806.5 L 727.1,802.8 L 731.9,810.0 L 742.3,813.1 L 743.0,808.7 L 752.4,810.0 L 759.8,821.9 L 771.1,809.6 L 766.5,791.6 L 771.4,793.2 L 769.1,786.5 L 770.7,781.7 L 774.2,783.2 L 770.2,772.5 L 775.4,762.5 L 769.8,751.3 L 772.6,741.5 L 790.2,736.7 L 794.2,729.2 L 794.6,736.1 L 804.9,743.5 L 781.8,749.0 L 775.9,757.5 L 779.9,766.0 L 791.5,768.8 L 787.6,768.7 L 796.6,787.1 L 788.6,784.9 L 790.4,790.7 L 938.5,777.4 L 1075.8,758.4 L 1082.1,798.2 L 1077.9,799.1 L 1075.0,793.3 L 1061.3,800.7 L 1056.8,798.1 L 1044.1,811.8 L 1018.3,817.8 L 1019.5,826.5 L 1009.5,838.8 L 1008.6,834.8 L 1004.3,837.9 L 1006.3,856.1 L 1001.7,847.6 L 998.6,858.7 L 995.6,857.0 L 983.7,878.0 L 974.0,882.3 L 974.1,890.3 L 961.9,900.0 L 960.0,894.4 L 941.6,902.1 L 932.2,903.5 L 931.8,899.5 L 891.2,915.4 L 897.2,908.2 L 888.7,912.8 L 884.3,906.6 L 846.2,903.8 L 815.5,913.2 L 797.6,907.5 L 782.4,912.0 L 769.6,908.8 L 750.2,913.4 L 701.9,914.1 L 696.5,920.8 L 683.8,921.1 L 679.8,916.2 L 676.0,921.3 L 680.0,925.3 L 672.0,922.4 L 667.5,932.1 L 658.2,936.6 L 654.3,947.8 L 649.7,948.3 L 646.2,971.5 L 639.6,982.5 L 605.9,986.5 L 604.1,991.4 L 597.7,991.8 L 602.9,997.3 L 592.7,1001.5 L 591.3,992.1 L 593.0,996.7 L 583.3,1002.8 L 581.7,1011.5 L 563.0,1021.2 L 559.5,1032.2 L 533.3,1064.7 L 501.9,1047.9 L 469.4,1042.0 L 482.1,1045.4 L 478.5,1050.9 L 496.3,1049.1 L 530.9,1066.6 L 521.2,1090.0 L 511.1,1097.6 L 506.6,1108.9 L 493.8,1112.6 L 482.6,1135.3 L 454.4,1158.1 L 425.6,1162.0 L 387.8,1188.0 L 364.9,1195.6 L 345.8,1223.0 L 332.0,1225.3 L 315.8,1239.0 L 286.8,1224.9 L 271.4,1223.5 L 227.1,1237.1 L 215.3,1226.3 L 202.3,1228.8 L 190.5,1221.5 L 183.8,1198.5 L 161.7,1191.2 L 149.2,1174.0 L 94.8,1154.8 L 72.4,1108.8 L 65.1,1072.5 L 69.9,1065.6 L 106.1,833.4 L 112.6,845.3 L 106.5,831.4 L 111.3,790.8 L 121.4,784.4 L 125.4,786.6 L 123.1,794.0 L 133.2,799.1 L 137.5,821.5 L 138.4,805.2 L 147.7,800.0 L 142.6,798.0 L 144.4,791.7 L 136.1,778.1 L 145.0,775.1 L 143.4,768.4 L 152.7,764.6 L 161.4,749.3 L 167.2,750.2 L 161.2,746.9 L 165.0,734.0 L 155.7,725.9 L 158.7,724.1 L 153.8,712.1 L 161.4,704.3 L 154.7,703.4 L 158.5,697.4 L 151.0,693.2 L 157.0,679.0 L 150.7,659.3 L 159.1,656.0 L 151.2,644.8 L 155.6,644.2 L 156.6,636.9 L 162.4,639.0 L 154.6,628.0 L 161.5,624.6 L 149.5,618.2 L 160.1,613.1 L 147.1,609.9 L 151.3,606.9 L 143.9,597.1 L 145.3,581.6 L 136.8,576.1 L 142.8,571.1 L 170.1,567.8 L 196.4,558.3 L 220.7,545.4 L 250.2,521.4 L 271.6,496.5 L 278.9,478.7 L 285.2,424.0 L 279.4,384.2 L 260.1,344.9 L 241.4,329.6 L 230.3,311.6 L 230.8,317.0 L 223.4,310.1 L 227.8,305.4 L 227.0,286.5 L 235.5,290.5 L 246.1,271.7 L 262.7,260.6 L 254.5,258.8 L 262.3,250.5 L 262.2,239.1 L 277.0,250.9 L 270.6,237.1 L 279.5,235.5 L 276.1,226.5 L 285.5,218.0 L 270.5,215.2 L 278.7,211.4 L 269.7,190.1 L 282.1,182.9 L 273.6,181.4 L 268.7,174.9 L 277.4,167.3 L 272.8,166.2 L 281.1,162.4 L 267.7,166.6 L 267.8,161.1 L 258.0,162.6 L 277.7,137.7 L 277.0,117.9 L 279.6,121.2 L 285.2,117.5 L 281.0,112.8 L 288.5,114.2 L 272.4,98.9 L 271.3,68.6 L 276.2,54.4 L 299.5,42.2 L 300.2,45.9 L 319.4,48.7 L 323.3,55.3 L 355.7,68.9 L 347.2,77.1 L 361.6,68.9 L 363.8,72.5 L 364.6,68.1 L 390.2,84.9 L 385.5,74.8 L 397.4,75.2 L 420.9,61.6 L 424.4,68.8 L 435.0,73.7 L 443.2,88.1 L 453.9,89.7 L 454.0,99.3 L 446.6,108.7 L 451.2,105.1 L 452.8,110.7 L 454.6,100.7 L 466.3,107.5 L 465.3,115.4 L 472.7,120.7 L 462.1,127.6 L 472.7,126.0 L 474.0,118.7 L 486.6,126.4 L 476.8,131.1 L 480.2,135.4 L 475.4,137.9 L 485.3,140.2 L 477.4,142.1 L 485.1,157.7 L 489.0,153.2 L 491.7,160.3 L 497.2,157.3 L 519.6,169.1 L 524.3,163.8 L 532.8,164.0 L 533.0,178.3 L 540.7,183.6 L 546.0,176.2 L 549.7,179.0 L 549.2,168.9 L 554.8,165.5 L 559.5,184.0 L 547.6,192.4 L 549.5,199.8 L 543.6,203.2 L 549.9,235.3 L 542.5,235.3 L 543.9,240.7 L 517.4,239.8 L 500.8,234.2 L 516.9,241.5 L 546.2,242.5 L 545.0,246.7 L 551.9,249.4 L 548.5,261.1 L 553.2,264.1 L 544.5,275.0 L 548.9,283.3 L 544.3,287.4 L 562.5,287.3 L 562.7,294.0 L 551.9,298.1 L 552.3,302.2 L 558.8,303.4 L 555.2,308.1 L 553.0,305.2 L 551.4,322.8 L 546.5,323.6 L 546.9,314.4 L 540.0,305.9 L 542.0,321.7 L 538.6,318.3 L 525.6,325.1 L 537.8,325.4 L 541.5,338.0 L 557.8,319.1 L 579.3,315.5 L 593.0,322.9 L 594.8,337.9 L 600.3,341.7 L 590.5,376.3 L 572.2,382.3 L 556.7,395.8 L 572.7,383.7 L 592.6,377.0 L 601.0,346.2 L 607.5,339.5 L 612.9,357.6 L 602.9,374.1 L 612.5,363.6 L 617.7,347.6 L 618.4,384.8 L 626.9,360.1 L 641.0,354.6 L 646.1,344.2 L 650.0,349.2 L 651.4,344.6 L 657.8,344.9 L 658.3,332.4 L 665.6,319.4 L 682.6,335.4 L 678.9,355.8 L 686.7,338.0 L 676.2,324.2 L 678.9,318.2 L 687.3,318.4 L 680.2,316.2 L 683.6,307.8 L 691.3,313.1 L 687.4,306.1 L 697.4,308.9 L 694.2,304.7 L 703.9,304.7 L 692.7,303.3 L 689.3,297.6 L 687.9,289.9 L 693.6,294.9 L 692.7,290.7 L 697.0,290.0 L 693.5,281.7 L 701.8,288.1 L 694.0,273.9 L 714.7,280.9 L 699.1,272.1 L 693.8,256.8 L 701.1,248.7 L 713.4,253.9 L 704.4,246.2 L 709.9,242.3 L 707.7,234.7 L 715.7,223.2 L 712.8,219.9 L 716.3,212.0 L 727.3,215.6 Z";
  var QUEBEC_MAP_REGIONS = [
    { name: "Nord-du-Québec", short: "Nord-du-Québec", x: 480, y: 190 },
    { name: "Côte-Nord", short: "Côte-Nord", x: 700, y: 410 },
    { name: "Saguenay–Lac-Saint-Jean", short: "Saguenay–Lac-St-Jean", x: 570, y: 520 },
    { name: "Abitibi-Témiscamingue", short: "Abitibi", x: 230, y: 530 },
    { name: "Outaouais", short: "Outaouais", x: 210, y: 690 },
    { name: "Laurentides", short: "Laurentides", x: 400, y: 685 },
    { name: "Mauricie", short: "Mauricie", x: 480, y: 735 },
    { name: "Capitale-Nationale", short: "Capitale-Nat.", x: 560, y: 730 },
    { name: "Bas-Saint-Laurent", short: "Bas-St-Laurent", x: 770, y: 810 },
    { name: "Chaudière-Appalaches", short: "Chaudière-App.", x: 590, y: 830 },
    { name: "Gaspésie–Îles-de-la-Madeleine", short: "Gaspésie", x: 960, y: 890 },
    { name: "Lanaudière", short: "Lanaudière", x: 415, y: 775 },
    { name: "Centre-du-Québec", short: "Centre-du-Qc", x: 465, y: 805 },
    { name: "Laval", short: "Laval", x: 385, y: 835 },
    { name: "Montréal", short: "Montréal", x: 375, y: 855 },
    { name: "Montérégie", short: "Montérégie", x: 415, y: 890 },
    { name: "Estrie", short: "Estrie", x: 495, y: 905 }
  ];
  function renderQuebecMap(){
    var mapEl = document.getElementById("quebecMap");
    if (!mapEl) return;
    var markers = QUEBEC_MAP_REGIONS.map(function(r){
      var active = state.quebecMapRegion === r.name;
      var labelAnchor = r.x > 700 ? "end" : "start";
      var labelX = r.x > 700 ? r.x - 22 : r.x + 22;
      return '<g class="qc-marker' + (active ? ' active' : '') + '" data-qc-region="' + esc(r.name) + '" tabindex="0" role="button">' +
        '<circle cx="' + r.x + '" cy="' + r.y + '" r="16"></circle>' +
        '<text x="' + labelX + '" y="' + (r.y + 4) + '" text-anchor="' + labelAnchor + '" class="qc-label">' + esc(r.short) + '</text>' +
        '<title>' + esc(r.name) + '</title>' +
      '</g>';
    }).join("");
    mapEl.innerHTML =
      '<svg viewBox="0 0 1184 1318" class="qc-svg" xmlns="http://www.w3.org/2000/svg">' +
        '<path class="qc-landmass" d="' + QUEBEC_OUTLINE_PATH + '"></path>' +
        markers +
      '</svg>' +
      '<p class="qc-map-legend" id="qcMapLegend">Survole ou touche un point pour voir la région, clique pour filtrer.</p>';
    mapEl.querySelectorAll("[data-qc-region]").forEach(function(g){
      g.addEventListener("click", function(){
        var region = g.getAttribute("data-qc-region");
        state.quebecMapRegion = (state.quebecMapRegion === region) ? "" : region;
        renderQuebecMap();
        renderDiscoverSidebarList();
        renderQuebecGrid();
      });
      g.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " "){ e.preventDefault(); g.click(); }
      });
    });
  }

  /* ================= DEMANDER L'ACCÈS ================= */

  var pendingRequestRecipeId = null;
  var pendingRequestFamilyId = null;
  var pendingRequestUserId = null;
  function openRequestAccess(recipeId, label, targetFamilyId, targetUserId){
    if (!state.session){ openAuth("login"); return; }
    pendingRequestRecipeId = recipeId;
    pendingRequestFamilyId = targetFamilyId;
    pendingRequestUserId = targetUserId || null;
    els.requestAccessRecipeName.textContent = recipeId ? "Recette : " + label + (pendingRequestUserId ? " (recette personnelle — la demande ira seulement à son auteur)" : "") : label;
    els["request-message"].value = "";
    els.requestAccessOverlay.hidden = false;
  }
  function closeRequestAccess(){ els.requestAccessOverlay.hidden = true; pendingRequestRecipeId = null; pendingRequestFamilyId = null; pendingRequestUserId = null; }
  els.requestAccessClose.addEventListener("click", closeRequestAccess);
  els.requestAccessCancel.addEventListener("click", closeRequestAccess);
  els.requestAccessOverlay.addEventListener("click", function(e){ if (e.target === els.requestAccessOverlay) closeRequestAccess(); });
  els.requestAccessConfirm.addEventListener("click", function(){
    if (!supabase || !pendingRequestFamilyId || !state.session) return;
    supabase.from("access_requests").insert({
      recipe_id: pendingRequestRecipeId,
      target_family_id: pendingRequestFamilyId,
      target_user_id: pendingRequestUserId,
      requested_by: state.session.user.id,
      requester_family_id: state.familyId,
      message: els["request-message"].value.trim() || null
    }).then(function(res){
      if (res.error){ toast("La demande n'a pas pu être envoyée — " + res.error.message); return; }
      closeRequestAccess();
      toast(pendingRequestUserId ? "Demande envoyée directement à cette personne !" : "Demande envoyée à toute la famille !");
    });
  });

  /* ================= BOÎTE DE RÉCEPTION (🔔) ================= */

  var notifTab = "received";
  function loadPendingCount(){
    if (!supabase || !state.session) return;
    supabase.rpc("my_pending_request_count").then(function(res){
      var n = res.data || 0;
      if (n > 0){ els.notifCount.hidden = false; els.notifCount.textContent = n; }
      else { els.notifCount.hidden = true; }
    });
  }

  function renderNotifBody(){
    els.notifBody.innerHTML = '<p class="hint">Chargement…</p>';
    els.notifTabReceived.classList.toggle("active", notifTab === "received");
    els.notifTabSent.classList.toggle("active", notifTab === "sent");

    if (notifTab === "received"){
      supabase.from("access_requests")
        .select("*, recipes(title), requester:requester_family_id(name)")
        .neq("requested_by", state.session.user.id)
        .order("created_at", { ascending: false })
        .then(function(res){
          if (res.error){ els.notifBody.innerHTML = '<p class="hint">Impossible de charger les demandes.</p>'; return; }
          var rows = res.data || [];
          if (!rows.length){ els.notifBody.innerHTML = '<p class="hint">Aucune demande reçue pour l\'instant.</p>'; return; }
          els.notifBody.innerHTML = rows.map(function(row){
            var famName = row.requester ? row.requester.name : "Une famille";
            var what = row.recipes ? "à <b>" + esc(row.recipes.title) + "</b>" : "une demande générale";
            var personalNote = row.target_user_id ? ' <span class="hint">(recette personnelle — envoyée à toi seul(e))</span>' : '';
            var actions = row.status === "pending"
              ? '<div class="notif-actions"><button class="btn btn-primary" data-approve="' + row.id + '" type="button">Approuver</button><button class="btn" data-decline="' + row.id + '" type="button">Refuser</button></div>'
              : '<span class="notif-status ' + row.status + '">' + (row.status === "approved" ? "Approuvée" : "Refusée") + '</span>';
            return '<div class="notif-item">' +
              '<p><b>' + esc(famName) + '</b> a demandé l\'accès ' + what + personalNote + '</p>' +
              (row.message ? '<p class="hint">« ' + esc(row.message) + ' »</p>' : '') +
              actions +
            '</div>';
          }).join("");
          els.notifBody.querySelectorAll("[data-approve]").forEach(function(btn){
            btn.addEventListener("click", function(){ respondToRequest(btn.getAttribute("data-approve"), true); });
          });
          els.notifBody.querySelectorAll("[data-decline]").forEach(function(btn){
            btn.addEventListener("click", function(){ respondToRequest(btn.getAttribute("data-decline"), false); });
          });
        });
    } else {
      supabase.from("access_requests")
        .select("*, recipes(title), target:target_family_id(name)")
        .eq("requested_by", state.session.user.id)
        .order("created_at", { ascending: false })
        .then(function(res){
          if (res.error){ els.notifBody.innerHTML = '<p class="hint">Impossible de charger tes demandes.</p>'; return; }
          var rows = res.data || [];
          if (!rows.length){ els.notifBody.innerHTML = '<p class="hint">Tu n\'as envoyé aucune demande pour l\'instant.</p>'; return; }
          els.notifBody.innerHTML = rows.map(function(row){
            var label = row.status === "pending" ? "En attente" : (row.status === "approved" ? "Approuvée" : "Refusée");
            var what = row.recipes ? esc(row.recipes.title) : "Demande générale";
            var toFam = row.target ? " à " + esc(row.target.name) : "";
            return '<div class="notif-item">' +
              '<p>' + what + toFam + '</p>' +
              '<span class="notif-status ' + row.status + '">' + label + '</span>' +
            '</div>';
          }).join("");
        });
    }
  }

  function respondToRequest(requestId, approve){
    supabase.from("access_requests").select("recipe_id, requested_by").eq("id", requestId).single().then(function(res){
      if (res.error || !res.data) return;
      var proceed = function(){
        supabase.from("access_requests").update({
          status: approve ? "approved" : "declined",
          responded_at: new Date().toISOString()
        }).eq("id", requestId).then(function(res2){
          if (res2.error){ toast("Une erreur est survenue."); return; }
          toast(approve ? "Accès accordé !" : "Demande refusée.");
          renderNotifBody();
          loadPendingCount();
        });
      };
      if (approve && res.data.recipe_id){
        supabase.from("recipe_shares").upsert({
          recipe_id: res.data.recipe_id,
          shared_with_user_id: res.data.requested_by
        }, { onConflict: "recipe_id,shared_with_user_id" }).then(proceed);
      } else {
        proceed();
      }
    });
  }

  if (els.notifBellBtn){
    els.notifBellBtn.addEventListener("click", function(){
      notifTab = "received";
      els.notifOverlay.hidden = false;
      renderNotifBody();
    });
  }
  els.notifClose.addEventListener("click", function(){ els.notifOverlay.hidden = true; });
  els.notifOverlay.addEventListener("click", function(e){ if (e.target === els.notifOverlay) els.notifOverlay.hidden = true; });
  els.notifTabReceived.addEventListener("click", function(){ notifTab = "received"; renderNotifBody(); });
  els.notifTabSent.addEventListener("click", function(){ notifTab = "sent"; renderNotifBody(); });

  /* ---------------- delete confirm ---------------- */
  function closeConfirm(){ els.confirmOverlay.hidden = true; state.deleteTargetId = null; }
  els.confirmClose.addEventListener("click", closeConfirm);
  els.confirmCancelBtn.addEventListener("click", closeConfirm);
  els.confirmOverlay.addEventListener("click", function(e){ if (e.target === els.confirmOverlay) closeConfirm(); });
  els.confirmDeleteBtn.addEventListener("click", function(){
    var id = state.deleteTargetId;
    if (!id || !supabase) return;
    closeConfirm();
    supabase.from("recipes").delete().eq("id", id).then(function(res){
      if (res.error){ toast("La suppression a échoué — " + res.error.message); return; }
      toast("Recette supprimée.");
    });
  });

  /* ---------------- add / edit form ---------------- */
  function resetForm(){
    els.recipeForm.reset();
    els["f-cat"].value = CATEGORIES[0];
    els.photoThumb.hidden = true;
    els.photoIcon.hidden = false;
    els.photoTxt.innerHTML = "<b>Choisir une photo</b><br>JPG ou PNG, redimensionnée automatiquement";
    els.formError.hidden = true;
    if (els.storyFieldBody) els.storyFieldBody.hidden = true;
    if (els.storyToggleBtn) els.storyToggleBtn.hidden = false;
    state.pendingPhotoBlob = null;
    state.pendingPhotoPreviewUrl = null;
    state.editingId = null;
  }

  function openForm(existing){
    if (!state.session){
      openAuth("login");
      return;
    }
    resetForm();
    if (existing){
      state.editingId = existing.id;
      els.formHeading.textContent = "Modifier la recette";
      els.formSubmit.textContent = "Enregistrer les modifications";
      els["f-title"].value = existing.title || "";
      els["f-cat"].value = existing.category || CATEGORIES[0];
      els["f-servings"].value = existing.servings || "";
      els["f-prep"].value = existing.prep_min || "";
      els["f-cook"].value = existing.cook_min || "";
      els["f-ingredients"].value = (existing.ingredients||[]).join("\n");
      els["f-steps"].value = (existing.steps||[]).join("\n");
      els["f-author"].value = existing.author || "";
      els["f-story"].value = existing.story || "";
      if (existing.story) { els.storyFieldBody.hidden = false; els.storyToggleBtn.hidden = true; }
      els["f-tags"].value = (existing.tags||[]).join(", ");
      els["f-source"].value = existing.source_url || "";
      els["f-visibility"].value = existing.visibility || "private";
      if (existing.photo_url){
        els.photoThumb.src = existing.photo_url;
        els.photoThumb.hidden = false;
        els.photoIcon.hidden = true;
        els.photoTxt.innerHTML = "<b>Photo actuelle</b><br>Cliquez pour la remplacer";
      }
    } else {
      els.formHeading.textContent = "Ajouter une recette";
      els.formSubmit.textContent = "Enregistrer la recette";
      els["f-visibility"].value = "private";
      if (!els["f-author"].value) els["f-author"].value = displayName(state.session);
      // Seulement le temps de préparation et de cuisson sont pré-remplis, à ajuster au besoin
      els["f-prep"].value = 15;
      els["f-cook"].value = 25;
    }
    els.formOverlay.hidden = false;
    els["f-title"].focus();
  }
  function closeForm(){ els.formOverlay.hidden = true; resetForm(); }

  els.formClose.addEventListener("click", closeForm);
  els.formCancel.addEventListener("click", closeForm);
  els.formOverlay.addEventListener("click", function(e){ if (e.target === els.formOverlay) closeForm(); });
  if (els.storyToggleBtn) els.storyToggleBtn.addEventListener("click", function(){ els.storyFieldBody.hidden = false; els.storyToggleBtn.hidden = true; els["f-story"].focus(); });
  if (els.sourceInfoBtn) els.sourceInfoBtn.addEventListener("click", function(){ els.sourceInfoText.hidden = !els.sourceInfoText.hidden; });

  els.photoDrop.addEventListener("click", function(){ els["f-photo"].click(); });
  els["f-photo"].addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    compressImage(file, function(blob, previewUrl){
      state.pendingPhotoBlob = blob;
      state.pendingPhotoPreviewUrl = previewUrl;
      els.photoThumb.src = previewUrl;
      els.photoThumb.hidden = false;
      els.photoIcon.hidden = true;
      els.photoTxt.innerHTML = "<b>Photo choisie</b><br>Cliquez pour la remplacer";
    }, function(){
      toast("Impossible de lire cette image.");
    });
  });

  function compressImage(file, onDone, onErr){
    var reader = new FileReader();
    reader.onerror = onErr;
    reader.onload = function(){
      var img = new Image();
      img.onerror = onErr;
      img.onload = function(){
        var maxW = 1400;
        var scale = Math.min(1, maxW / img.width);
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(function(blob){
          if (!blob){ onErr(); return; }
          onDone(blob, canvas.toDataURL("image/jpeg", 0.6));
        }, "image/jpeg", 0.82);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ================= SCANNER UNE RECETTE PAR PHOTO (IA) ================= */

  function blobToBase64(blob, cb){
    var reader = new FileReader();
    reader.onloadend = function(){
      var base64 = String(reader.result).split(",")[1];
      cb(base64);
    };
    reader.readAsDataURL(blob);
  }

  if (els.scanBtn){
    els.scanBtn.addEventListener("click", function(){
      if (!state.session){ openAuth("login"); return; }
      els.scanPhotoInput.click();
    });
  }

  if (els.scanPhotoInput){
    els.scanPhotoInput.addEventListener("change", function(e){
      var file = e.target.files && e.target.files[0];
      els.scanPhotoInput.value = "";
      if (!file) return;

      toast("📷 Analyse de la photo en cours… ça peut prendre quelques secondes.");
      compressImage(file, function(blob, previewUrl){
        blobToBase64(blob, function(base64){
          fetch("/api/scan-recipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64, mediaType: "image/jpeg" })
          }).then(function(res){ return res.json().then(function(data){ return { ok: res.ok, data: data }; }); })
            .then(function(result){
              if (!result.ok || result.data.error){
                toast("Le scanner n'a pas fonctionné — " + (result.data && result.data.error ? result.data.error : "erreur inconnue") + ". Tu peux quand même remplir la recette à la main.");
                return;
              }
              var extracted = result.data;
              openForm(null);
              els["f-title"].value = extracted.title || "";
              if (extracted.servings) els["f-servings"].value = extracted.servings;
              if (extracted.prep_min) els["f-prep"].value = extracted.prep_min;
              if (extracted.cook_min) els["f-cook"].value = extracted.cook_min;
              els["f-ingredients"].value = (extracted.ingredients || []).join("\n");
              els["f-steps"].value = (extracted.steps || []).join("\n");
              // Réutilise la photo scannée comme photo de la recette
              state.pendingPhotoBlob = blob;
              state.pendingPhotoPreviewUrl = previewUrl;
              els.photoThumb.src = previewUrl;
              els.photoThumb.hidden = false;
              els.photoIcon.hidden = true;
              els.photoTxt.innerHTML = "<b>Photo scannée</b><br>Cliquez pour la remplacer";
              toast("✨ Recette extraite ! Vérifie et corrige au besoin avant d'enregistrer.");
            })
            .catch(function(){
              toast("Le scanner n'a pas pu joindre le serveur. Réessaie dans un instant.");
            });
        });
      }, function(){
        toast("Impossible de lire cette image.");
      });
    });
  }

  function showFormError(msg){
    els.formError.textContent = msg;
    els.formError.hidden = false;
  }

  els.recipeForm.addEventListener("submit", function(e){
    e.preventDefault();
    if (!supabase) return;
    els.formError.hidden = true;

    var title = els["f-title"].value.trim();
    var ingredients = els["f-ingredients"].value.split("\n").map(function(s){ return s.trim(); }).filter(Boolean);
    var steps = els["f-steps"].value.split("\n").map(function(s){ return s.trim(); }).filter(Boolean);
    var sourceVal = els["f-source"].value.trim();
    if (!title || !ingredients.length || !steps.length) return;
    if (!sourceVal){
      showFormError("Indique la provenance de la recette (un lien, ou une description comme « Recette personnelle »).");
      return;
    }

    var data = {
      title: title,
      category: els["f-cat"].value,
      servings: Number(els["f-servings"].value) || null,
      prep_min: Number(els["f-prep"].value) || null,
      cook_min: Number(els["f-cook"].value) || null,
      ingredients: ingredients,
      steps: steps,
      author: els["f-author"].value.trim() || null,
      story: els["f-story"].value.trim() || null,
      tags: els["f-tags"].value.split(",").map(function(s){ return s.trim(); }).filter(Boolean),
      source_url: sourceVal,
      visibility: els["f-visibility"].value,
      family_id: state.familyId
    };
    if (!state.editingId) data.created_by = state.session.user.id;

    els.formSubmit.disabled = true;

    function finishSave(photoUrl){
      if (photoUrl) data.photo_url = photoUrl;
      var query = state.editingId
        ? supabase.from("recipes").update(data).eq("id", state.editingId)
        : supabase.from("recipes").insert(data);

      query.then(function(res){
        els.formSubmit.disabled = false;
        if (res.error){ showFormError("L'enregistrement a échoué — " + res.error.message); return; }
        closeForm();
        toast(state.editingId ? "Recette mise à jour." : "Recette enregistrée.");
      });
    }

    if (state.pendingPhotoBlob){
      var path = (state.session.user.id) + "/" + Date.now() + ".jpg";
      supabase.storage.from("recipe-photos").upload(path, state.pendingPhotoBlob, {
        contentType: "image/jpeg",
        upsert: true
      }).then(function(res){
        if (res.error){
          els.formSubmit.disabled = false;
          showFormError("L'envoi de la photo a échoué — " + res.error.message);
          return;
        }
        var pub = supabase.storage.from("recipe-photos").getPublicUrl(path);
        finishSave(pub.data.publicUrl);
      });
    } else {
      finishSave(null);
    }
  });

  /* ---------------- importer une recette (texte collé) ---------------- */
  var IMPORT_VERB_START = /^(pr[ée]chauffer|m[ée]langer|incorporer|ajouter|verser|couper|trancher|cuire|chauffer|laisser|r[ée]server|servir|assaisonner|badigeonner|saupoudrer|d[ée]poser|placer|diviser|rouler|former|presser|retirer|couvrir|r[ée]duire|augmenter|refroidir|reposer|p[ée]trir|transf[ée]rer|continuer|r[ée]p[ée]ter|pr[ée]parer|faire|griller|fouetter|battre|\u00e9taler|d[ée]couper|napper|garnir|disposer|preheat|mix|combine|add|stir|whisk|roll|shape|press|sprinkle|place|allow|cook|serve|season|cut|slice|pour|heat|let|continue|repeat|transfer|return|remove|cover|reduce|increase|chill|rest|knead|divide|form|brush|bake|bring|simmer|garnish|top|drizzle|spread|arrange|toss|fold|beat|whip|melt|dice|chop|grate|peel|marinate|refrigerate|freeze|drain|rinse)\b/i;
  var IMPORT_UNIT_WORD = /\b(g|kg|ml|l|cup|cups|tsp|tbsp|teaspoon|tablespoon|oz|ounce|ounces|lb|lbs|pound|pounds|clove|cloves|tasse|tasses|cuill[èe]re[s]?|gramme[s]?|paquet|paquets|pinc[ée]e?|tranche[s]?|gousse[s]?)\b/i;
  var IMPORT_QTY_START = /^[\d½¼¾⅓⅔⅛]/;
  var IMPORT_HEADER_ING = /^(ingr[ée]dients?|ingredients?)\s*:?$/i;
  var IMPORT_HEADER_STEPS = /^([ée]tapes?|instructions?|pr[ée]paration|m[ée]thode|directions?|steps?)\s*:?$/i;
  var IMPORT_META_SERVINGS = /^(?:portions?|servings?|rendement|yield|pour)\s*:?\s*(\d+)/i;
  var IMPORT_META_PREP = /^(?:temps de )?pr[ée]paration\s*:?\s*(\d+)|^prep(?:\s*time)?\s*:?\s*(\d+)/i;
  var IMPORT_META_COOK = /^(?:temps de )?cuisson\s*:?\s*(\d+)|^(?:cook|bake)(?:\s*time)?\s*:?\s*(\d+)/i;
  var IMPORT_NOISE = /^(imprimer|print|\u00e9pingler|pin( it)?|jump to recipe|rate this recipe|share this|partager|save recipe|sauvegarder|note[sz]?\s*:?$|par\s+[a-zà-ÿ]+$|by\s+[a-z]+$|recette (originale )?de\s|adapt[ée]e? de\s|adapted from\s|source\s*:|publi[ée] le|posted on)\b/i;
  var IMPORT_NOISE_STARS = /^[★☆\s]*\d+(\.\d+)?\s*(\/\s*5)?\s*(from|avis|reviews?|votes?)\b/i;

  function importLooksLikeIngredient(line){
    if (IMPORT_VERB_START.test(line)) return false;
    if (IMPORT_QTY_START.test(line)) return true;
    if (IMPORT_UNIT_WORD.test(line) && line.length < 90) return true;
    if (!/[.!?]\s*$/.test(line) && line.length < 60) return true;
    return false;
  }
  function importSplitIngredientLine(line){
    if (line.indexOf(",") === -1) return [line];
    var parts = line.split(",").map(function(p){ return p.trim(); }).filter(Boolean);
    if (parts.length < 2) return [line];
    var allLook = parts.every(function(p){ return IMPORT_QTY_START.test(p) || IMPORT_UNIT_WORD.test(p); });
    return allLook ? parts : [line];
  }

  function parseRecipeText(text){
    var lines = text.split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean);
    if (!lines.length) return { title: "", ingredients: [], steps: [], servings: null, prep_min: null, cook_min: null };

    var hasHeaders = lines.some(function(l){ return IMPORT_HEADER_ING.test(l) || IMPORT_HEADER_STEPS.test(l); });
    var title = lines[0].replace(/^#+\s*/, "");
    var body = lines.slice(1);
    var ingredients = [];
    var steps = [];
    var section = null;
    var servings = null, prep_min = null, cook_min = null;

    body.forEach(function(raw){
      if (IMPORT_HEADER_ING.test(raw)){ section = "ing"; return; }
      if (IMPORT_HEADER_STEPS.test(raw)){ section = "steps"; return; }

      // Métadonnées (portions, temps) : on les extrait pour remplir les champs dédiés, sans les mettre dans les ingrédients
      var mServ = raw.match(IMPORT_META_SERVINGS);
      if (mServ){ servings = Number(mServ[1]); return; }
      var mPrep = raw.match(IMPORT_META_PREP);
      if (mPrep){ prep_min = Number(mPrep[1] || mPrep[2]); return; }
      var mCook = raw.match(IMPORT_META_COOK);
      if (mCook){ cook_min = Number(mCook[1] || mCook[2]); return; }

      // Bruit courant (boutons "Imprimer", évaluations, mentions d'auteur, etc.) : on ignore complètement
      if (IMPORT_NOISE.test(raw) || IMPORT_NOISE_STARS.test(raw)) return;

      var isNumberedStep = /^\d+[.)]\s+(?=[A-Za-zÀ-ÿ])/.test(raw);
      var cleaned = raw.replace(/^[-*•]+\s*/, "").replace(/^\d+[.)]\s+/, "");

      if (isNumberedStep){ steps.push(cleaned); return; }
      if (hasHeaders && section === "ing"){ importSplitIngredientLine(cleaned).forEach(function(x){ ingredients.push(x); }); return; }
      if (hasHeaders && section === "steps"){ steps.push(cleaned); return; }

      if (importLooksLikeIngredient(cleaned)) importSplitIngredientLine(cleaned).forEach(function(x){ ingredients.push(x); });
      else steps.push(cleaned);
    });

    return { title: title, ingredients: ingredients, steps: steps, servings: servings, prep_min: prep_min, cook_min: cook_min };
  }

  els.importBtn.addEventListener("click", function(){
    if (!state.session){ openAuth("login"); return; }
    els.importSourceUrl.value = "";
    els.importError.hidden = true;
    if (els.importCat) els.importCat.value = "Autre";
    if (els.importTags) els.importTags.value = "";
    if (els.importVisibility) els.importVisibility.value = "private";
    els.importOverlay.hidden = false;
    els.importSourceUrl.focus();
  });
  function closeImport(){ els.importOverlay.hidden = true; }
  els.importClose.addEventListener("click", closeImport);
  els.importCancel.addEventListener("click", closeImport);
  els.importSourceUrl.addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); els.importAnalyze.click(); } });
  els.importOverlay.addEventListener("click", function(e){ if (e.target === els.importOverlay) closeImport(); });
  els.importAnalyze.addEventListener("click", function(){
    var sourceUrl = els.importSourceUrl.value.trim();
    els.importError.hidden = true;
    if (!/^https?:\/\//i.test(sourceUrl)){
      els.importError.textContent = "Colle un vrai lien web, qui commence par http:// ou https://.";
      els.importError.hidden = false;
      return;
    }
    var chosenCat = els.importCat ? els.importCat.value : "Autre";
    var chosenTags = els.importTags ? els.importTags.value.split(",").map(function(s){ return s.trim(); }).filter(Boolean) : [];
    var chosenVisibility = els.importVisibility ? els.importVisibility.value : "private";
    els.importAnalyze.disabled = true;
    els.importAnalyze.textContent = "Importation…";

    function fallbackTitle(){
      try { return new URL(sourceUrl).hostname.replace(/^www\./, ""); }
      catch (e) { return "Recette importée"; }
    }

    fetch("/api/link-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: sourceUrl })
    }).then(function(res){ return res.json(); })
      .catch(function(){ return {}; })
      .then(function(preview){
        var title = (preview && preview.title) ? preview.title : fallbackTitle();
        var photoUrl = (preview && preview.image) ? preview.image : null;
        supabase.from("recipes").insert({
          title: title,
          category: chosenCat,
          tags: chosenTags,
          ingredients: [],
          steps: [],
          source_url: sourceUrl,
          photo_url: photoUrl,
          visibility: chosenVisibility,
          is_bookmark: true,
          family_id: state.familyId,
          created_by: state.session.user.id
        }).then(function(res2){
          els.importAnalyze.disabled = false;
          els.importAnalyze.textContent = "Importer";
          if (res2.error){
            els.importError.textContent = "L'importation a échoué — " + res2.error.message;
            els.importError.hidden = false;
            return;
          }
          closeImport();
          loadRecipes();
          toast(photoUrl ? "Recette importée avec sa photo !" : "Recette importée ! (aucune photo trouvée sur la page)");
        });
      });
  });

  /* ================= BLOGUE NUTRITION ================= */

  function switchView(view){
    state.view = view;
    var recipeMode = view === "recipes";
    var discoverMode = view === "discover";
    var blogMode = view === "blog";
    var plannerMode = view === "planner";
    els.viewSwitch.querySelectorAll(".view-btn").forEach(function(b){
      b.classList.toggle("active", b.getAttribute("data-view") === view);
    });
    els.tabs.style.display = recipeMode ? "" : "none";
    els.favToggleBtn.style.display = recipeMode ? "" : "none";
    els.importBtn.style.display = recipeMode ? "" : "none";
    els.searchInput.parentNode.style.display = (recipeMode || discoverMode) ? "" : "none";

    els.grid.hidden = !recipeMode;
    els.emptyState.hidden = recipeMode ? els.emptyState.hidden : true;
    els.featuredSection.hidden = recipeMode ? els.featuredSection.hidden : true;
    els.memoryBanner.hidden = recipeMode ? els.memoryBanner.hidden : true;

    if (els.discoverWrap) els.discoverWrap.hidden = !discoverMode;
    els.searchInput.parentNode.style.display = (recipeMode || (discoverMode && state.discoverSubView === "tous")) ? "" : "none";
    if (!discoverMode && els.discoverFilters) els.discoverFilters.hidden = true;
    els.discoverEmptyState.hidden = discoverMode ? !!state.discoverRecipes.length : true;

    els.blogList.hidden = !blogMode;
    els.blogEmptyState.hidden = blogMode ? !!state.blogPosts.length : true;

    els.plannerView.hidden = !plannerMode;

    els.addBtn.hidden = discoverMode || plannerMode || (blogMode && !state.isAdminFamily);
    els.addBtn.innerHTML = blogMode
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg> Nouvel article'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg> Ajouter une recette';

    if (recipeMode){ renderGrid(); renderFeatured(); }
    else if (discoverMode){ switchDiscoverSub(state.discoverSubView || "quebec"); }
    else if (plannerMode){ renderPlanner(); loadMealPlan(); }
    else { renderBlogList(); loadBlogPosts(); }
  }
  els.viewSwitch.querySelectorAll(".view-btn").forEach(function(b){
    b.addEventListener("click", function(){ switchView(b.getAttribute("data-view")); });
  });

  els.addBtn.addEventListener("click", function(){
    if (state.view === "blog") openBlogForm(null); else if (state.view === "recipes") openForm(null);
  }, true);

  function excerpt(text, n){
    var t = (text || "").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n).trim() + "…" : t;
  }

  function renderBlogList(){
    els.blogList.innerHTML = "";
    if (!state.blogPosts.length){
      els.blogEmptyState.hidden = false;
      return;
    }
    els.blogEmptyState.hidden = true;
    state.blogPosts.forEach(function(p){
      var card = document.createElement("div");
      card.className = "blog-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      var photoHtml = p.cover_url
        ? '<img src="' + esc(p.cover_url) + '" alt="" loading="lazy">'
        : '<span class="ph-fallback">📰</span>';
      card.innerHTML =
        '<div class="blog-card-photo">' + photoHtml + '</div>' +
        '<div class="blog-card-body">' +
          '<p class="blog-card-kicker">' + (p.author ? "Par " + esc(p.author) : "Blogue nutrition") + '</p>' +
          '<h3 class="blog-card-title">' + esc(p.title) + '</h3>' +
          '<p class="blog-card-excerpt">' + esc(excerpt(p.body, 180)) + '</p>' +
        '</div>';
      card.addEventListener("click", function(){ openBlogDetail(p.id); });
      card.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openBlogDetail(p.id); } });
      els.blogList.appendChild(card);
    });
  }

  function findBlogPost(id){
    return state.blogPosts.filter(function(p){ return p.id === id; })[0];
  }

  function openBlogDetail(id){
    var p = findBlogPost(id);
    if (!p) return;
    var photoBlock = p.cover_url ? '<img class="blog-article-photo" src="' + esc(p.cover_url) + '" alt="">' : "";
    var paragraphs = (p.body || "").split(/\n{2,}|\r?\n/).map(function(s){ return s.trim(); }).filter(Boolean);
    var bodyHtml = paragraphs.map(function(par){ return "<p>" + esc(par) + "</p>"; }).join("");
    var actionsHtml = state.isAdminFamily
      ? '<div class="blog-article-actions">' +
          '<button class="btn" data-blog-edit type="button">Modifier</button>' +
          '<button class="btn btn-danger" data-blog-delete type="button">Supprimer</button>' +
        '</div>'
      : '';
    var blogSourceHtml = p.source_url
      ? (/^https?:\/\//i.test(p.source_url)
          ? '<p class="detail-source">Source : <a href="' + esc(p.source_url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.source_url) + ' ↗</a></p>'
          : '<p class="detail-source">Source : ' + esc(p.source_url) + '</p>')
      : '';
    els.blogDetailSheet.innerHTML =
      photoBlock +
      '<div class="sheet-head" style="padding-top:' + (p.cover_url ? '14px' : '20px') + ';">' +
        '<div></div>' +
        '<button class="sheet-close" data-close type="button">&times;</button>' +
      '</div>' +
      '<div class="blog-article-body">' +
        '<p class="blog-article-kicker">Blogue nutrition</p>' +
        '<h1 class="blog-article-title display">' + esc(p.title) + '</h1>' +
        '<p class="blog-article-meta">' + (p.author ? "Par " + esc(p.author) : "") + '</p>' +
        '<div class="blog-article-text">' + bodyHtml + '</div>' +
        blogSourceHtml +
        actionsHtml +
      '</div>';
    els.blogDetailSheet.querySelector("[data-close]").addEventListener("click", closeBlogDetail);
    var editBtn = els.blogDetailSheet.querySelector("[data-blog-edit]");
    var delBtn = els.blogDetailSheet.querySelector("[data-blog-delete]");
    if (editBtn) editBtn.addEventListener("click", function(){ closeBlogDetail(); openBlogForm(p); });
    if (delBtn) delBtn.addEventListener("click", function(){
      if (!supabase) return;
      closeBlogDetail();
      supabase.from("blog_posts").delete().eq("id", p.id).then(function(res){
        if (res.error){ toast("La suppression a échoué — " + res.error.message); return; }
        toast("Article supprimé.");
      });
    });
    els.blogDetailOverlay.hidden = false;
  }
  function closeBlogDetail(){ els.blogDetailOverlay.hidden = true; els.blogDetailSheet.innerHTML = ""; }
  els.blogDetailOverlay.addEventListener("click", function(e){ if (e.target === els.blogDetailOverlay) closeBlogDetail(); });

  function resetBlogForm(){
    els.blogForm.reset();
    els.bfPhotoThumb.hidden = true;
    els.bfPhotoIcon.hidden = false;
    els.bfPhotoTxt.innerHTML = "<b>Choisir une photo</b><br>JPG ou PNG, redimensionnée automatiquement";
    els.blogFormError.hidden = true;
    state.pendingBlogPhotoBlob = null;
    state.editingBlogId = null;
  }

  function openBlogForm(existing){
    if (!state.session){ openAuth("login"); return; }
    if (!state.isAdminFamily){ toast("Seule la famille Pageau peut publier sur le blogue."); return; }
    resetBlogForm();
    if (existing){
      state.editingBlogId = existing.id;
      els.blogFormHeading.textContent = "Modifier l'article";
      els.blogFormSubmit.textContent = "Enregistrer les modifications";
      els["bf-title"].value = existing.title || "";
      els["bf-body"].value = existing.body || "";
      els["bf-author"].value = existing.author || "";
      els["bf-source"].value = existing.source_url || "";
      if (existing.cover_url){
        els.bfPhotoThumb.src = existing.cover_url;
        els.bfPhotoThumb.hidden = false;
        els.bfPhotoIcon.hidden = true;
        els.bfPhotoTxt.innerHTML = "<b>Photo actuelle</b><br>Cliquez pour la remplacer";
      }
    } else {
      els.blogFormHeading.textContent = "Nouvel article";
      els.blogFormSubmit.textContent = "Publier l'article";
      if (!els["bf-author"].value) els["bf-author"].value = displayName(state.session);
    }
    els.blogFormOverlay.hidden = false;
    els["bf-title"].focus();
  }
  function closeBlogForm(){ els.blogFormOverlay.hidden = true; resetBlogForm(); }
  els.blogFormClose.addEventListener("click", closeBlogForm);
  els.blogFormCancel.addEventListener("click", closeBlogForm);
  els.blogFormOverlay.addEventListener("click", function(e){ if (e.target === els.blogFormOverlay) closeBlogForm(); });

  els.bfPhotoDrop.addEventListener("click", function(){ els["bf-photo"].click(); });
  els["bf-photo"].addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    compressImage(file, function(blob, previewUrl){
      state.pendingBlogPhotoBlob = blob;
      els.bfPhotoThumb.src = previewUrl;
      els.bfPhotoThumb.hidden = false;
      els.bfPhotoIcon.hidden = true;
      els.bfPhotoTxt.innerHTML = "<b>Photo choisie</b><br>Cliquez pour la remplacer";
    }, function(){ toast("Impossible de lire cette image."); });
  });

  els.blogForm.addEventListener("submit", function(e){
    e.preventDefault();
    if (!supabase) return;
    els.blogFormError.hidden = true;
    var title = els["bf-title"].value.trim();
    var body = els["bf-body"].value.trim();
    if (!title || !body) return;

    var data = {
      title: title,
      body: body,
      author: els["bf-author"].value.trim() || null,
      source_url: els["bf-source"].value.trim() || null,
      family_id: state.familyId
    };
    els.blogFormSubmit.disabled = true;

    function finishSave(coverUrl){
      if (coverUrl) data.cover_url = coverUrl;
      var query = state.editingBlogId
        ? supabase.from("blog_posts").update(data).eq("id", state.editingBlogId)
        : supabase.from("blog_posts").insert(data);
      query.then(function(res){
        els.blogFormSubmit.disabled = false;
        if (res.error){
          els.blogFormError.textContent = "L'enregistrement a échoué — " + res.error.message;
          els.blogFormError.hidden = false;
          return;
        }
        closeBlogForm();
        toast(state.editingBlogId ? "Article mis à jour." : "Article publié.");
      });
    }

    if (state.pendingBlogPhotoBlob){
      var path = (state.session.user.id) + "/" + Date.now() + ".jpg";
      supabase.storage.from("blog-photos").upload(path, state.pendingBlogPhotoBlob, {
        contentType: "image/jpeg",
        upsert: true
      }).then(function(res){
        if (res.error){
          els.blogFormSubmit.disabled = false;
          els.blogFormError.textContent = "L'envoi de la photo a échoué — " + res.error.message;
          els.blogFormError.hidden = false;
          return;
        }
        var pub = supabase.storage.from("blog-photos").getPublicUrl(path);
        finishSave(pub.data.publicUrl);
      });
    } else {
      finishSave(null);
    }
  });

  function updateBlogTabVisibility(){
    var blogBtn = els.viewSwitch.querySelector('[data-view="blog"]');
    if (!blogBtn) return;
    var shouldShow = state.isAdminFamily || state.blogPosts.length > 0;
    blogBtn.style.display = shouldShow ? "" : "none";
    if (!shouldShow && state.view === "blog") switchView("recipes");
  }

  function loadBlogPosts(){
    if (!supabase) return;
    supabase.from("blog_posts").select("*").then(function(res){
      if (res.error) return;
      state.blogPosts = (res.data || []).slice().sort(function(a,b){
        return String(b.created_at||"").localeCompare(String(a.created_at||""));
      });
      if (state.view === "blog") renderBlogList();
      updateBlogTabVisibility();
    });
  }

  /* ---------------- auth ---------------- */
  function renderAuthWidget(){
    if (state.session){
      els.authWidget.innerHTML =
        '<div class="auth-user">Connecté(e) : <b>' + esc(displayName(state.session)) + '</b> · ' +
        '<button class="auth-link" id="signOutBtn" type="button">se déconnecter</button></div>';
      var btn = document.getElementById("signOutBtn");
      if (btn) btn.addEventListener("click", function(){
        supabase.auth.signOut();
      });
    } else {
      els.authWidget.innerHTML = '<button class="auth-link" id="authOpenBtn" type="button">Se connecter / créer un compte</button>';
      var b2 = document.getElementById("authOpenBtn");
      if (b2) b2.addEventListener("click", function(){ openAuth("login"); });
    }
    updateAuthGate();
  }

  function updateAuthGate(){
    var loggedIn = !!state.session;
    if (els.authRequiredScreen) els.authRequiredScreen.hidden = loggedIn;
    if (els.controlsWrap) els.controlsWrap.hidden = !loggedIn;
    if (els.mainContent) els.mainContent.hidden = !loggedIn;
    if (els.addBtn) els.addBtn.hidden = !loggedIn;
  }
  if (els.authRequiredBtn) els.authRequiredBtn.addEventListener("click", function(){ openAuth("login"); });

  function setAuthMode(mode){
    state.authMode = mode;
    els.authTabLogin.classList.toggle("active", mode === "login");
    els.authTabSignup.classList.toggle("active", mode === "signup");
    els.authHeading.textContent = mode === "login" ? "Se connecter" : "Créer un compte";
    els.authSubmit.textContent = mode === "login" ? "Se connecter" : "Créer mon compte";
    els.authNameField.hidden = mode !== "signup";
    els.authHint.textContent = mode === "login" ? "" : "Utilisé pour signer tes recettes.";
    els.authError.hidden = true;
  }
  els.authTabLogin.addEventListener("click", function(){ setAuthMode("login"); });
  els.authTabSignup.addEventListener("click", function(){ setAuthMode("signup"); });

  function openAuth(mode){
    setAuthMode(mode || "login");
    els.authForm.reset();
    els.authOverlay.hidden = false;
    els["a-email"].focus();
  }
  function closeAuth(){ els.authOverlay.hidden = true; }
  els.authClose.addEventListener("click", closeAuth);
  els.authOverlay.addEventListener("click", function(e){ if (e.target === els.authOverlay) closeAuth(); });

  els.authForm.addEventListener("submit", function(e){
    e.preventDefault();
    if (!supabase) return;
    els.authError.hidden = true;
    var email = els["a-email"].value.trim();
    var password = els["a-password"].value;
    var name = els["a-name"].value.trim();
    els.authSubmit.disabled = true;

    var action = state.authMode === "login"
      ? supabase.auth.signInWithPassword({ email: email, password: password })
      : supabase.auth.signUp({ email: email, password: password, options: { data: { display_name: name || email.split("@")[0] } } });

    action.then(function(res){
      els.authSubmit.disabled = false;
      if (res.error){
        els.authError.textContent = res.error.message;
        els.authError.hidden = false;
        return;
      }
      if (state.authMode === "signup" && res.data && !res.data.session){
        toast("Compte créé — vérifie tes courriels pour confirmer ton adresse, puis connecte-toi.");
        setAuthMode("login");
        return;
      }
      closeAuth();
      toast("Connecté(e).");
    });
  });

  /* ---------------- famille (VERSION 2) ---------------- */
  function setFamTab(mode){
    state.famOnboardMode = mode;
    els.famTabCreate.classList.toggle("active", mode === "create");
    els.famTabJoin.classList.toggle("active", mode === "join");
    els.famCreateField.hidden = mode !== "create";
    els.famJoinField.hidden = mode !== "join";
    els.famSubmit.textContent = mode === "create" ? "Créer ma famille" : "Rejoindre";
    els.famError.hidden = true;
  }
  els.famTabCreate.addEventListener("click", function(){ setFamTab("create"); });
  els.famTabJoin.addEventListener("click", function(){ setFamTab("join"); });

  function renderFamilyBadge(){
    if (!els.familyBadgeBtn) return;
    if (state.familyId && state.familyName){
      els.familyBadgeBtn.textContent = "👪 " + state.familyName;
      els.familyBadgeBtn.hidden = false;
      if (els.notifBellBtn) els.notifBellBtn.hidden = false;
      if (els.myFollowsBellBtn) els.myFollowsBellBtn.hidden = false;
    } else {
      els.familyBadgeBtn.hidden = true;
      if (els.notifBellBtn) els.notifBellBtn.hidden = true;
      if (els.myFollowsBellBtn) els.myFollowsBellBtn.hidden = true;
    }
  }

  els.familyBadgeBtn.addEventListener("click", function(){
    els.famInfoHeading.textContent = state.familyName;
    els.famInviteCodeBox.textContent = state.familyInviteCode || "—";
    if (els.famRegionEdit) els.famRegionEdit.value = state.familyRegion || "";
    els.familyInfoOverlay.hidden = false;
  });
  els.famInfoClose.addEventListener("click", function(){ els.familyInfoOverlay.hidden = true; });
  els.familyInfoOverlay.addEventListener("click", function(e){ if (e.target === els.familyInfoOverlay) els.familyInfoOverlay.hidden = true; });
  if (els.famRegionSaveBtn){
    els.famRegionSaveBtn.addEventListener("click", function(){
      var newRegion = els.famRegionEdit.value;
      if (!supabase || !state.familyId) return;
      supabase.from("families").update({ region: newRegion || null }).eq("id", state.familyId).then(function(res){
        if (res.error){ toast("Impossible d'enregistrer la région — " + res.error.message); return; }
        state.familyRegion = newRegion;
        toast("Région enregistrée !");
      });
    });
  }
  if (els.myFollowsLink){
    els.myFollowsLink.addEventListener("click", function(e){
      e.preventDefault();
      els.familyInfoOverlay.hidden = true;
      openMyFollowsList();
    });
  }
  if (els.famCopyLinkBtn){
    els.famCopyLinkBtn.addEventListener("click", function(){
      if (!state.familyInviteCode) return;
      var link = window.location.origin + window.location.pathname + "?join=" + state.familyInviteCode;
      navigator.clipboard.writeText(link).then(function(){
        toast("Lien copié — colle-le dans un texto ou un courriel !");
      }, function(){
        toast("Impossible de copier automatiquement — voici le lien : " + link);
      });
    });
  }

  function enterFamily(id, name, code, isAdmin, region){
    state.familyId = id;
    state.familyName = name;
    state.familyInviteCode = code || state.familyInviteCode;
    state.isAdminFamily = !!isAdmin;
    state.familyRegion = region || "";
    renderFamilyBadge();
    els.familyOnboardingOverlay.hidden = true;
    loadRecipes();
    loadDiscoverRecipes();
    loadBlogPosts();
    loadFavorites();
    loadPendingCount();
    loadFollowedFamilies();
  }

  els.famSubmit.addEventListener("click", function(){
    if (!supabase) return;
    els.famError.hidden = true;
    els.famSubmit.disabled = true;

    if (state.famOnboardMode === "create"){
      var name = els["fam-name"].value.trim();
      var regionVal = document.getElementById("fam-region").value;
      if (!name){ els.famSubmit.disabled = false; return; }
      if (!regionVal){
        els.famError.textContent = "Choisis la région de ta famille — c'est obligatoire.";
        els.famError.hidden = false;
        els.famSubmit.disabled = false;
        return;
      }
      supabase.rpc("create_family", { family_name: name, family_region: regionVal }).then(function(res){
        els.famSubmit.disabled = false;
        if (res.error || !res.data || !res.data.length){
          els.famError.textContent = "Impossible de créer la famille — " + (res.error ? res.error.message : "erreur inconnue");
          els.famError.hidden = false;
          return;
        }
        var row = res.data[0];
        enterFamily(row.family_id, name, row.invite_code, false, regionVal);
        toast("Famille créée !");
      });
    } else {
      var code = els["fam-code"].value.trim();
      if (!code){ els.famSubmit.disabled = false; return; }
      supabase.rpc("join_family_by_code", { code: code }).then(function(res){
        els.famSubmit.disabled = false;
        if (res.error || !res.data || !res.data.length){
          els.famError.textContent = "Code invalide — vérifie-le auprès de la personne qui t'a invité(e).";
          els.famError.hidden = false;
          return;
        }
        var row = res.data[0];
        enterFamily(row.family_id, row.family_name, null, false, row.family_region);
        toast("Tu as rejoint " + row.family_name + " !");
      });
    }
  });

  function checkFamilyMembership(){
    if (!supabase || !state.session) return;
    supabase.from("family_members").select("family_id, families(name, invite_code, is_admin_family, region)").eq("user_id", state.session.user.id).then(function(res){
      if (res.error) return;
      var rows = res.data || [];
      if (!rows.length){
        var params = new URLSearchParams(window.location.search);
        var joinCode = params.get("join");
        if (joinCode){
          setFamTab("join");
          els["fam-code"].value = joinCode.toUpperCase();
          els["fam-name"].value = "";
        } else {
          setFamTab("create");
          els["fam-name"].value = "";
          els["fam-code"].value = "";
        }
        els.familyOnboardingOverlay.hidden = false;
        return;
      }
      var fam = rows[0].families;
      enterFamily(rows[0].family_id, fam ? fam.name : "", fam ? fam.invite_code : "", fam ? fam.is_admin_family : false, fam ? fam.region : "");
    });
  }

  /* ================= DÉCOUVRIR (recettes publiques) ================= */

  function filteredSortedDiscoverRecipes(){
    var term = state.searchTerm.trim().toLowerCase();
    var list = state.discoverRecipes.filter(function(r){
      if (state.discoverCategory && r.category !== state.discoverCategory) return false;
      if (state.discoverRegion && (!r.families || r.families.region !== state.discoverRegion)) return false;
      if (state.discoverTag && (!r.tags || r.tags.indexOf(state.discoverTag) === -1)) return false;
      if (term){
        var hay = (r.title + " " + (r.ingredients||[]).join(" ") + " " + (r.tags||[]).join(" ")).toLowerCase();
        if (hay.indexOf(term) === -1) return false;
      }
      return true;
    });
    if (state.discoverSort === "family_az"){
      list = list.slice().sort(function(a,b){
        var an = a.families ? a.families.name : "";
        var bn = b.families ? b.families.name : "";
        return an.localeCompare(bn);
      });
    } else if (state.discoverSort === "title_az"){
      list = list.slice().sort(function(a,b){ return a.title.localeCompare(b.title); });
    }
    // "recent" garde l'ordre déjà trié par date (sortByDate à la source)
    return list;
  }

  function renderDiscoverFilters(){
    if (!els.discoverFilters) return;
    var regions = [];
    state.discoverRecipes.forEach(function(r){
      var reg = r.families && r.families.region;
      if (reg && regions.indexOf(reg) === -1) regions.push(reg);
    });
    regions.sort();
    var tags = [];
    state.discoverRecipes.forEach(function(r){
      (r.tags||[]).forEach(function(t){ if (tags.indexOf(t) === -1) tags.push(t); });
    });
    tags.sort();

    if (!state.discoverRecipes.length){ els.discoverFilters.hidden = true; return; }
    els.discoverFilters.hidden = false;

    els.discoverFilters.innerHTML =
      '<div class="discover-filters-row">' +
        '<select id="discoverCatSelect">' +
          '<option value="">Toutes les catégories</option>' +
          CATEGORIES.map(function(c){ return '<option value="' + esc(c) + '"' + (state.discoverCategory === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join("") +
        '</select>' +
        '<select id="discoverRegionSelect">' +
          '<option value="">Toutes les régions</option>' +
          regions.map(function(r){ return '<option value="' + esc(r) + '"' + (state.discoverRegion === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join("") +
        '</select>' +
        '<select id="discoverSortSelect">' +
          '<option value="recent"' + (state.discoverSort === "recent" ? ' selected' : '') + '>Plus récentes</option>' +
          '<option value="title_az"' + (state.discoverSort === "title_az" ? ' selected' : '') + '>Titre A-Z</option>' +
          '<option value="family_az"' + (state.discoverSort === "family_az" ? ' selected' : '') + '>Famille A-Z</option>' +
        '</select>' +
      '</div>' +
      (tags.length
        ? '<div class="discover-tag-row">' +
            tags.map(function(t){
              return '<button type="button" class="tag-filter-pill' + (state.discoverTag === t ? ' active' : '') + '" data-tag-filter="' + esc(t) + '">' + esc(t) + '</button>';
            }).join("") +
          '</div>'
        : '');

    document.getElementById("discoverCatSelect").addEventListener("change", function(e){
      state.discoverCategory = e.target.value;
      renderDiscoverGrid();
    });
    document.getElementById("discoverRegionSelect").addEventListener("change", function(e){
      state.discoverRegion = e.target.value;
      renderDiscoverGrid();
    });
    document.getElementById("discoverSortSelect").addEventListener("change", function(e){
      state.discoverSort = e.target.value;
      renderDiscoverGrid();
    });
    els.discoverFilters.querySelectorAll("[data-tag-filter]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var t = btn.getAttribute("data-tag-filter");
        state.discoverTag = (state.discoverTag === t) ? "" : t;
        renderDiscoverFilters();
        renderDiscoverGrid();
      });
    });
  }

  function renderDiscoverGrid(){
    els.discoverGrid.innerHTML = "";
    var list = filteredSortedDiscoverRecipes();
    if (!list.length){
      els.discoverEmptyState.hidden = false;
      els.discoverEmptyState.querySelector("p.display").textContent = state.discoverRecipes.length
        ? "Aucun résultat avec ces filtres"
        : "Rien à découvrir pour l'instant";
      return;
    }
    els.discoverEmptyState.hidden = true;
    list.forEach(function(r){
      var card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      var photoHtml = r.photo_url
        ? '<img src="' + esc(r.photo_url) + '" alt="" loading="lazy">'
        : '<span class="ph-fallback">' + esc(initialsWord(r.title)) + '</span>';
      var famName = r.families ? r.families.name : "Famille inconnue";
      var famRegion = r.families && r.families.region ? " · 📍 " + esc(r.families.region) : "";
      var tagsHtml = (r.tags && r.tags.length)
        ? '<div class="tag-row">' + r.tags.slice(0,3).map(function(t){ return '<span class="tag-pill">' + esc(t) + '</span>'; }).join("") + '</div>'
        : '';
      card.innerHTML =
        '<div class="card-photo">' + photoHtml + '</div>' +
        '<div class="card-body">' +
          '<p class="card-cat">' + esc(r.category || "Autre") + (r.is_bookmark ? ' · 🔗 Signet' : '') + ' · <span class="fam-link" data-fam-link>👪 ' + esc(famName) + '</span>' + famRegion + '</p>' +
          '<h3 class="card-title">' + esc(r.title) + '</h3>' +
          tagsHtml +
          '<div class="card-meta">' +
            (r.prep_min || r.cook_min ? '<span>' + ICON_CLOCK + ' ' + ((num(r.prep_min)+num(r.cook_min)) || "–") + ' min</span>' : '') +
            (r.servings ? '<span>' + ICON_PLATE + ' ' + num(r.servings) + '</span>' : '') +
          '</div>' +
        '</div>';
      card.addEventListener("click", function(){ openDiscoverRecipeOrBookmark(r); });
      card.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openDiscoverRecipeOrBookmark(r); } });
      card.style.setProperty("--cat-color", categoryColor(r.category));
      var famLink = card.querySelector("[data-fam-link]");
      if (famLink && r.family_id){
        famLink.addEventListener("click", function(e){
          e.stopPropagation();
          openFamilyProfile(r.family_id, famName, r.families ? r.families.region : "");
        });
      }
      els.discoverGrid.appendChild(card);
    });
  }

  function findDiscoverRecipe(id){
    return state.discoverRecipes.filter(function(r){ return r.id === id; })[0]
      || (state.followedRecipesCache || []).filter(function(r){ return r.id === id; })[0];
  }

  function copyRecipeToMyFamily(r){
    if (!supabase || !state.familyId) return;
    var data = {
      title: r.title,
      category: r.category,
      prep_min: r.prep_min,
      cook_min: r.cook_min,
      servings: r.servings,
      ingredients: r.ingredients,
      steps: r.steps,
      photo_url: r.photo_url,
      author: null,
      story: r.story,
      tags: r.tags,
      source_url: r.source_url,
      family_id: state.familyId,
      visibility: "private",
      copied_from: r.families ? r.families.name : null
    };
    supabase.from("recipes").insert(data).then(function(res){
      if (res.error){ toast("La copie a échoué — " + res.error.message); return; }
      closeDetail();
      switchView("recipes");
      toast("Recette copiée dans ton carnet !");
    });
  }

  function openDiscoverRecipeOrBookmark(r){
    if (r.is_bookmark && r.source_url){
      window.open(r.source_url, "_blank", "noopener");
      return;
    }
    openDiscoverDetail(r.id);
  }

  function openDiscoverDetail(id){
    var r = findDiscoverRecipe(id);
    if (!r) return;
    var photoBlock = r.photo_url ? '<img class="detail-photo" src="' + esc(r.photo_url) + '" alt="">' : "";
    var ingHtml = (r.ingredients||[]).map(function(i,idx){ return '<li><label class="ing-check"><input type="checkbox" data-ing-idx="' + idx + '"><span>' + esc(i) + '</span></label></li>'; }).join("");
    var stepHtml = (r.steps||[]).map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("");
    var famName = r.families ? r.families.name : "une autre famille";
    var tagsHtml = (r.tags && r.tags.length)
      ? '<div class="detail-tags">' + r.tags.map(function(t){ return '<span class="tag-pill">' + esc(t) + '</span>'; }).join("") + '</div>'
      : '';
    var sourceHtml = r.source_url
      ? (/^https?:\/\//i.test(r.source_url)
          ? '<p class="detail-source">Provenance : <a href="' + esc(r.source_url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.source_url) + ' ↗</a></p>'
          : '<p class="detail-source">Provenance : ' + esc(r.source_url) + '</p>')
      : '';

    els.detailSheet.innerHTML =
      photoBlock +
      '<div class="sheet-head" style="padding-top:' + (r.photo_url ? '14px' : '20px') + ';">' +
        '<div></div>' +
        '<button class="sheet-close" data-close type="button">&times;</button>' +
      '</div>' +
      '<div class="detail-body">' +
        '<p class="detail-cat">' + esc(r.category || "Autre") + ' · <span class="fam-link" data-fam-link>👪 Recette de ' + esc(famName) + '</span></p>' +
        '<h2 class="detail-title display">' + esc(r.title) + '</h2>' +
        (r.story ? '<p class="detail-story">' + esc(r.story) + '</p>' : '') +
        tagsHtml +
        '<div class="detail-stats">' +
          (r.prep_min ? '<div class="stat"><span class="num mono">' + num(r.prep_min) + ' min</span><span class="lbl">Préparation</span></div>' : '') +
          (r.cook_min ? '<div class="stat"><span class="num mono">' + num(r.cook_min) + ' min</span><span class="lbl">Cuisson</span></div>' : '') +
          (r.servings ? '<div class="stat"><span class="num mono">' + num(r.servings) + '</span><span class="lbl">Portions</span></div>' : '') +
        '</div>' +
        '<div class="detail-cols">' +
          '<div><p class="detail-h">Ingrédients</p><ul class="ing-list">' + ingHtml + '</ul></div>' +
          '<div><p class="detail-h">Étapes</p><ol class="step-list">' + stepHtml + '</ol></div>' +
        '</div>' +
        sourceHtml +
        '<div class="detail-actions">' +
          '<button class="btn btn-primary" data-copy type="button">📋 Copier dans mon carnet</button>' +
          '<button class="btn btn-danger" data-report type="button">🚩 Signaler</button>' +
        '</div>' +
        commentsBlockHtml() +
      '</div>';

    els.detailSheet.querySelector("[data-close]").addEventListener("click", closeDetail);
    els.detailSheet.querySelector("[data-copy]").addEventListener("click", function(){ copyRecipeToMyFamily(r); });
    var famLinkDetail = els.detailSheet.querySelector("[data-fam-link]");
    if (famLinkDetail && r.family_id){
      famLinkDetail.addEventListener("click", function(){
        closeDetail();
        openFamilyProfile(r.family_id, famName, r.families ? r.families.region : "");
      });
    }
    els.detailSheet.querySelector("[data-report]").addEventListener("click", function(){ openReportOverlay(r.id); });
    renderComments(r.id);
    wireCommentForm(r.id);
    els.detailOverlay.hidden = false;
    state.openRecipeId = r.id;
  }

  /* ================= PLANIFICATEUR + LISTE D'ÉPICERIE ================= */

  function getMonday(date){
    var d = new Date(date);
    var day = d.getDay();
    var diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  }
  function pad2(n){ return n < 10 ? "0" + n : String(n); }
  function isoDate(d){ return d.getFullYear() + "-" + pad2(d.getMonth()+1) + "-" + pad2(d.getDate()); }
  function currentWeekDates(){
    var monday = getMonday(new Date());
    monday.setDate(monday.getDate() + state.plannerWeekOffset * 7);
    var days = [];
    for (var i = 0; i < 7; i++){ var d = new Date(monday); d.setDate(monday.getDate() + i); days.push(d); }
    return days;
  }
  function normalizeIngKey(s){ return s.trim().toLowerCase(); }
  var MEAL_SLOTS = [
    { key: "dejeuner", label: "Déjeuner", icon: "🍳" },
    { key: "diner", label: "Dîner", icon: "🥪" },
    { key: "souper", label: "Souper", icon: "🍽️" },
    { key: "collation", label: "Collation", icon: "🍎" }
  ];
  var LEFTOVERS_VALUE = "__restants__";
  function mealKey(dateIso, slot){ return dateIso + "|" + slot; }

  function loadMealPlan(){
    if (!supabase || !state.familyId) return;
    var days = currentWeekDates();
    supabase.from("meal_plan_display").select("*").eq("family_id", state.familyId)
      .gte("plan_date", isoDate(days[0])).lte("plan_date", isoDate(days[6]))
      .then(function(res){
        if (res.error) return;
        state.mealPlan = {};
        (res.data || []).forEach(function(row){ state.mealPlan[mealKey(row.plan_date, row.meal_slot)] = row; });
        if (state.view === "planner") renderPlanner();
        loadGroceryChecks();
      });
  }

  function assignMeal(dateIso, slot, recipeId, servings, isLeftovers){
    if (!supabase || !state.familyId || !state.session) return;
    if (!recipeId && !isLeftovers){
      supabase.from("meal_plan").delete().eq("family_id", state.familyId).eq("plan_date", dateIso).eq("meal_slot", slot).then(function(){ loadMealPlan(); });
      return;
    }
    supabase.from("meal_plan").upsert({
      family_id: state.familyId, plan_date: dateIso, meal_slot: slot,
      recipe_id: isLeftovers ? null : recipeId,
      servings: isLeftovers ? null : (servings || null),
      is_leftovers: !!isLeftovers,
      created_by: state.session.user.id
    }, { onConflict: "family_id,plan_date,meal_slot" }).then(function(res){
      if (res.error){ toast("Impossible d'assigner — " + res.error.message); return; }
      loadMealPlan();
    });
  }

  // Ajustement approximatif des quantités selon les portions désirées.
  // Comprend les nombres simples (500), les fractions unicode (½ ¼ ¾ ⅓ ⅔),
  // les fractions écrites (1/2) et les nombres mixtes (1 1/2). Les quantités
  // en mots ("une pincée", "au goût") ne peuvent pas être ajustées.
  var FRACTION_MAP = { "½":0.5, "¼":0.25, "¾":0.75, "⅓":1/3, "⅔":2/3, "⅛":0.125, "⅜":0.375, "⅝":0.625, "⅞":0.875 };
  function parseLeadingQuantity(text){
    var m = text.match(/^(\d+)?\s*([½¼¾⅓⅔⅛⅜⅝⅞])/);
    if (m) return { value: (m[1] ? parseInt(m[1],10) : 0) + FRACTION_MAP[m[2]], len: m[0].length };
    m = text.match(/^(\d+\s+)?(\d+)\s*\/\s*(\d+)/);
    if (m) return { value: (m[1] ? parseInt(m[1],10) : 0) + (parseInt(m[2],10) / parseInt(m[3],10)), len: m[0].length };
    m = text.match(/^(\d+(?:[.,]\d+)?)/);
    if (m) return { value: parseFloat(m[1].replace(",", ".")), len: m[0].length };
    return null;
  }
  function formatQuantity(n){
    var whole = Math.floor(n);
    var frac = n - whole;
    var common = [[0.25,"¼"],[0.5,"½"],[0.75,"¾"],[1/3,"⅓"],[2/3,"⅔"]];
    for (var i = 0; i < common.length; i++){
      if (Math.abs(frac - common[i][0]) < 0.05) return (whole > 0 ? whole + " " : "") + common[i][1];
    }
    var rounded = Math.round(n * 4) / 4;
    return (rounded % 1 === 0) ? String(rounded) : String(rounded);
  }
  function scaleIngredientText(text, ratio){
    if (!ratio || ratio === 1) return text;
    var parsed = parseLeadingQuantity(text);
    if (!parsed) return text;
    return formatQuantity(parsed.value * ratio) + text.slice(parsed.len);
  }

  function currentWeekIngredients(){
    var days = currentWeekDates();
    var items = [];
    var seen = {};
    days.forEach(function(d){
      var iso = isoDate(d);
      MEAL_SLOTS.forEach(function(slotDef){
        var entry = state.mealPlan[mealKey(iso, slotDef.key)];
        if (!entry || entry.is_leftovers || !entry.recipe_id) return;
        var recipe = state.recipes.filter(function(r){ return r.id === entry.recipe_id; })[0];
        if (!recipe) return;
        var ratio = (entry.servings && recipe.servings) ? (entry.servings / recipe.servings) : 1;
        (recipe.ingredients || []).forEach(function(ing){
          var scaled = scaleIngredientText(ing, ratio);
          var key = normalizeIngKey(scaled);
          if (!seen[key]){ seen[key] = true; items.push({ key: key, label: scaled }); }
        });
      });
    });
    return items;
  }

  function loadGroceryChecks(){
    if (!supabase || !state.familyId) return;
    supabase.from("grocery_checks").select("*").eq("family_id", state.familyId).then(function(res){
      if (res.error) return;
      state.groceryChecks = {};
      state.manualGroceryItems = [];
      (res.data || []).forEach(function(row){
        state.groceryChecks[row.item_text] = row.checked;
        if (row.is_manual) state.manualGroceryItems.push(row.item_text);
      });
      if (state.view === "planner") renderGroceryList();
    });
  }

  function addManualGroceryItem(text){
    text = text.trim();
    if (!text || !supabase || !state.familyId) return;
    var key = normalizeIngKey(text);
    supabase.from("grocery_checks").upsert(
      { family_id: state.familyId, item_text: key, checked: false, is_manual: true },
      { onConflict: "family_id,item_text" }
    ).then(function(res){
      if (res.error){ toast("Impossible d'ajouter l'item."); return; }
      loadGroceryChecks();
    });
  }

  function removeManualGroceryItem(key){
    if (!supabase || !state.familyId) return;
    supabase.from("grocery_checks").delete().eq("family_id", state.familyId).eq("item_text", key).then(function(res){
      if (res.error){ toast("Impossible de retirer l'item."); return; }
      loadGroceryChecks();
    });
  }

  function toggleGroceryCheck(key, checked){
    state.groceryChecks[key] = checked;
    if (!supabase || !state.familyId) return;
    supabase.from("grocery_checks").upsert(
      { family_id: state.familyId, item_text: key, checked: checked },
      { onConflict: "family_id,item_text" }
    ).then(function(res){
      if (res.error) toast("Impossible de sauvegarder la case cochée.");
    });
  }

  function renderGroceryList(){
    var listEl = els.plannerView.querySelector("#groceryList");
    if (!listEl) return;
    var recipeItems = currentWeekIngredients();
    var manualItems = state.manualGroceryItems.map(function(key){ return { key: key, label: key, manual: true }; });
    var items = recipeItems.concat(manualItems);

    var itemsHtml = items.length
      ? items.map(function(it){
          var checked = !!state.groceryChecks[it.key];
          return '<label class="grocery-item' + (checked ? ' checked' : '') + '">' +
            '<input type="checkbox" data-grocery-key="' + esc(it.key) + '"' + (checked ? ' checked' : '') + '>' +
            '<span>' + esc(it.label) + '</span>' +
            (it.manual ? '<button type="button" class="grocery-remove" data-grocery-remove="' + esc(it.key) + '" title="Retirer">&times;</button>' : '') +
            '</label>';
        }).join("")
      : '<p class="hint">Assigne des recettes à la semaine pour générer la liste automatiquement.</p>';

    listEl.innerHTML = itemsHtml +
      '<div class="grocery-add-row">' +
        '<input type="text" id="groceryAddInput" placeholder="Ajouter un item (ex. papier de toilette)…">' +
        '<button type="button" class="btn" id="groceryAddBtn">+ Ajouter</button>' +
      '</div>';

    listEl.querySelectorAll("[data-grocery-key]").forEach(function(cb){
      cb.addEventListener("change", function(){
        cb.closest(".grocery-item").classList.toggle("checked", cb.checked);
        toggleGroceryCheck(cb.getAttribute("data-grocery-key"), cb.checked);
      });
    });
    listEl.querySelectorAll("[data-grocery-remove]").forEach(function(btn){
      btn.addEventListener("click", function(e){
        e.preventDefault();
        removeManualGroceryItem(btn.getAttribute("data-grocery-remove"));
      });
    });
    var addInput = listEl.querySelector("#groceryAddInput");
    var addBtn = listEl.querySelector("#groceryAddBtn");
    function submitManualItem(){
      addManualGroceryItem(addInput.value);
      addInput.value = "";
    }
    if (addBtn) addBtn.addEventListener("click", submitManualItem);
    if (addInput) addInput.addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); submitManualItem(); } });
  }

  function exportGroceryList(){
    var recipeItems = currentWeekIngredients();
    var manualItems = state.manualGroceryItems.map(function(key){ return { key: key, label: key }; });
    var items = recipeItems.concat(manualItems).filter(function(it){ return !state.groceryChecks[it.key]; });
    var days = currentWeekDates();
    var title = "Liste d'épicerie — " + days[0].getDate() + " " + MONTH_SHORT[days[0].getMonth()] + " au " + days[6].getDate() + " " + MONTH_SHORT[days[6].getMonth()];
    if (!items.length){ toast("Rien à imprimer — tout est déjà coché, ou la liste est vide."); return; }
    var html = "<!doctype html><html><head><meta charset='utf-8'><title>" + title + "</title>" +
      "<style>body{font-family:Georgia,'Times New Roman',serif;padding:40px;max-width:520px;margin:0 auto;color:#23302a;}" +
      "h1{font-size:21px;border-bottom:2px solid #23302a;padding-bottom:12px;}" +
      "ul{list-style:none;padding:0;margin-top:20px;} li{padding:9px 0;border-bottom:1px solid #ccc;font-size:15px;display:flex;gap:10px;}" +
      "li:before{content:'☐';font-size:17px;}</style></head><body>" +
      "<h1>" + title + "</h1><ul>" +
      items.map(function(it){ return "<li>" + esc(it.label) + "</li>"; }).join("") +
      "</ul></body></html>";
    var win = window.open("", "_blank");
    if (!win){ toast("Ton navigateur a bloqué la fenêtre — autorise les pop-ups pour ce site."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(function(){ win.print(); }, 300);
  }

  var DAY_NAMES = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
  var MONTH_SHORT = ["jan","fév","mar","avr","mai","juin","juil","août","sep","oct","nov","déc"];

  function renderPlanner(){
    if (!els.plannerView) return;
    var sub = state.plannerSubView || "horaire";
    els.plannerView.innerHTML =
      '<div class="planner-subtabs">' +
        '<button type="button" class="planner-subtab' + (sub === "horaire" ? ' active' : '') + '" data-planner-sub="horaire">📅 Horaire de la semaine</button>' +
        '<button type="button" class="planner-subtab' + (sub === "epicerie" ? ' active' : '') + '" data-planner-sub="epicerie">🛒 Liste d\'épicerie</button>' +
      '</div>' +
      '<div class="planner-content" id="plannerContent"></div>';

    els.plannerView.querySelectorAll("[data-planner-sub]").forEach(function(btn){
      btn.addEventListener("click", function(){
        state.plannerSubView = btn.getAttribute("data-planner-sub");
        renderPlanner();
      });
    });

    if (sub === "epicerie") renderPlannerGrocery();
    else renderPlannerSchedule();
  }

  function renderPlannerSchedule(){
    var content = document.getElementById("plannerContent");
    if (!content) return;
    var days = currentWeekDates();
    var datalistEl = document.getElementById("recipeDatalist");
    if (datalistEl) datalistEl.innerHTML = state.recipes.map(function(r){ return '<option value="' + esc(r.title) + '">'; }).join("");

    var rowsHtml = days.map(function(d, idx){
      var iso = isoDate(d);
      var slotsHtml = MEAL_SLOTS.map(function(slotDef){
        var entry = state.mealPlan[mealKey(iso, slotDef.key)];
        var isLeftover = entry && entry.is_leftovers;
        var searchValue = (entry && entry.recipe_id && entry.recipe_title) ? entry.recipe_title : "";
        var showServings = !!(entry && !isLeftover && entry.recipe_id);
        return '<div class="planner-slot">' +
          '<label class="planner-slot-label">' + slotDef.icon + ' ' + slotDef.label + '</label>' +
          '<div class="planner-slot-row">' +
            '<input type="text" class="planner-search" list="recipeDatalist" placeholder="Chercher une recette…" autocomplete="off" ' +
              (isLeftover ? 'disabled placeholder="🥡 Restants"' : '') +
              'data-plan-date="' + iso + '" data-plan-slot="' + slotDef.key + '" value="' + esc(searchValue) + '">' +
            '<button type="button" class="planner-leftovers-btn' + (isLeftover ? ' active' : '') + '" ' +
              'data-plan-date="' + iso + '" data-plan-slot="' + slotDef.key + '" title="Marquer comme restants">🥡</button>' +
          '</div>' +
          '<input type="number" class="planner-servings" min="1" max="30" placeholder="Portions" ' +
            'data-servings-date="' + iso + '" data-servings-slot="' + slotDef.key + '" ' +
            (entry && entry.servings ? 'value="' + entry.servings + '"' : '') +
            (showServings ? '' : ' hidden') + '>' +
        '</div>';
      }).join("");
      return '<div class="planner-day">' +
        '<div class="planner-day-label">' + DAY_NAMES[idx] + '<span class="planner-date">' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()] + '</span></div>' +
        slotsHtml +
      '</div>';
    }).join("");

    content.innerHTML =
      '<div class="planner-week-nav">' +
        '<button class="btn" id="plannerPrevWeek" type="button">← Semaine précédente</button>' +
        '<span class="planner-week-label">' + days[0].getDate() + ' ' + MONTH_SHORT[days[0].getMonth()] + ' – ' + days[6].getDate() + ' ' + MONTH_SHORT[days[6].getMonth()] + '</span>' +
        '<button class="btn" id="plannerNextWeek" type="button">Semaine suivante →</button>' +
      '</div>' +
      '<div class="planner-days">' + rowsHtml + '</div>';

    days.forEach(function(d){
      var iso = isoDate(d);
      MEAL_SLOTS.forEach(function(slotDef){
        var searchInput = content.querySelector('input.planner-search[data-plan-date="' + iso + '"][data-plan-slot="' + slotDef.key + '"]');
        var servingsInput = content.querySelector('input.planner-servings[data-servings-date="' + iso + '"][data-servings-slot="' + slotDef.key + '"]');
        var leftoverBtn = content.querySelector('.planner-leftovers-btn[data-plan-date="' + iso + '"][data-plan-slot="' + slotDef.key + '"]');
        if (!searchInput) return;

        searchInput.addEventListener("input", function(){
          var match = state.recipes.filter(function(r){ return r.title === searchInput.value; })[0];
          if (match){
            if (!servingsInput.value && match.servings) servingsInput.value = match.servings;
            servingsInput.hidden = false;
            assignMeal(iso, slotDef.key, match.id, Number(servingsInput.value) || null, false);
          }
        });
        searchInput.addEventListener("blur", function(){
          if (!searchInput.value.trim()){
            servingsInput.hidden = true;
            assignMeal(iso, slotDef.key, null, null, false);
          }
        });
        if (servingsInput){
          servingsInput.addEventListener("change", function(){
            var match = state.recipes.filter(function(r){ return r.title === searchInput.value; })[0];
            if (match) assignMeal(iso, slotDef.key, match.id, Number(servingsInput.value) || null, false);
          });
        }
        if (leftoverBtn){
          leftoverBtn.addEventListener("click", function(){
            var entry = state.mealPlan[mealKey(iso, slotDef.key)];
            var alreadyLeftover = entry && entry.is_leftovers;
            assignMeal(iso, slotDef.key, null, null, !alreadyLeftover);
          });
        }
      });
    });

    content.querySelector("#plannerPrevWeek").addEventListener("click", function(){ state.plannerWeekOffset--; loadMealPlan(); });
    content.querySelector("#plannerNextWeek").addEventListener("click", function(){ state.plannerWeekOffset++; loadMealPlan(); });
  }

  function renderPlannerGrocery(){
    var content = document.getElementById("plannerContent");
    if (!content) return;
    content.innerHTML =
      '<div class="grocery-section">' +
        '<div class="grocery-header"><p class="detail-h" style="margin:0;">🛒 Liste d\'épicerie de la semaine</p>' +
        '<button class="btn" id="groceryExportBtn" type="button">🖨️ Imprimer / PDF</button></div>' +
        '<div class="grocery-list" id="groceryList"><p class="hint">Chargement…</p></div>' +
      '</div>';
    content.querySelector("#groceryExportBtn").addEventListener("click", exportGroceryList);
    renderGroceryList();
  }

  /* ---------------- data wiring ---------------- */
  function sortByDate(list){
    return list.slice().sort(function(a,b){
      return String(b.created_at||"").localeCompare(String(a.created_at||""));
    });
  }

  function loadRecipes(){
    if (!supabase || !state.familyId) return;
    supabase.from("recipes").select("*").eq("family_id", state.familyId).then(function(res){
      if (res.error){ toast("Impossible de charger les recettes — " + res.error.message); return; }
      state.recipes = sortByDate(res.data || []);
      renderGrid();
      renderFeatured();
    });
  }

  function loadDiscoverRecipes(){
    if (!supabase || !state.familyId) return;
    supabase.from("recipes").select("*, families(name, region)").eq("visibility", "public").neq("family_id", state.familyId).then(function(res){
      if (res.error){ toast("Impossible de charger Découvrir — " + res.error.message); return; }
      state.discoverRecipes = sortByDate(res.data || []);
      if (state.view === "discover") renderDiscoverFilters();
      if (state.view === "discover") renderDiscoverGrid();
    });
  }

  function subscribeRealtime(){
    if (!supabase) return;
    supabase.channel("recipes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "recipes" }, function(){
        loadRecipes();
        loadDiscoverRecipes();
      })
      .subscribe();
    supabase.channel("blog-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "blog_posts" }, function(){
        loadBlogPosts();
      })
      .subscribe();
    supabase.channel("comments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, function(payload){
        var rid = (payload.new && payload.new.recipe_id) || (payload.old && payload.old.recipe_id);
        if (state.openRecipeId && rid === state.openRecipeId) renderComments(state.openRecipeId);
      })
      .subscribe();
    supabase.channel("access-requests-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "access_requests" }, function(){
        loadPendingCount();
        if (!els.notifOverlay.hidden) renderNotifBody();
      })
      .subscribe();
  }

  function init(){
    renderModeBanner();
    renderTabs();
    renderAuthWidget();
    renderGrid();

    if (!supabase) return;

    supabase.auth.getSession().then(function(res){
      state.session = res.data && res.data.session ? res.data.session : null;
      renderAuthWidget();
      if (state.session){
        checkFamilyMembership();
      } else {
        var params = new URLSearchParams(window.location.search);
        if (params.get("join")){
          openAuth("signup");
          toast("Crée ton compte pour rejoindre la famille qui t'a invité(e) !");
        }
      }
    });
    supabase.auth.onAuthStateChange(function(_event, session){
      state.session = session;
      renderAuthWidget();
      if (!session){
        state.showFavoritesOnly = false;
        state.familyId = null;
        state.familyName = "";
        state.familyInviteCode = "";
        renderFamilyBadge();
        state.recipes = [];
        state.blogPosts = [];
        renderGrid();
        renderFeatured();
        if (els.favToggleBtn){
          els.favToggleBtn.classList.remove("active");
          els.favToggleBtn.setAttribute("aria-pressed", "false");
        }
        return;
      }
      checkFamilyMembership();
    });

    subscribeRealtime();
  }

  document.addEventListener("keydown", function(e){
    if (!els.cookOverlay.hidden){
      if (e.key === "ArrowRight"){ var nb = els.cookSheet.querySelector("[data-cook-next]"); if (nb) nb.click(); }
      if (e.key === "ArrowLeft"){ var pb = els.cookSheet.querySelector("[data-cook-prev]"); if (pb) pb.click(); }
    }
    if (e.key === "Escape"){
      if (!els.cookOverlay.hidden) closeCookMode();
      else if (!els.confirmOverlay.hidden) closeConfirm();
      else if (!els.importOverlay.hidden) closeImport();
      else if (!els.blogFormOverlay.hidden) closeBlogForm();
      else if (!els.formOverlay.hidden) closeForm();
      else if (!els.authOverlay.hidden) closeAuth();
      else if (!els.blogDetailOverlay.hidden) closeBlogDetail();
      else if (!els.detailOverlay.hidden) closeDetail();
    }
  });

  init();
})();
