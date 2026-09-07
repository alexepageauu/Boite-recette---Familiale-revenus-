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
   "cookOverlay","cookSheet","viewSwitch","importBtn","importOverlay","importClose","importText","importSourceUrl","importCancel","importAnalyze",
   "blogList","blogEmptyState","blogFormOverlay","blogFormHeading","blogFormClose","blogForm","blogFormError",
   "bf-title","bf-photo","bfPhotoDrop","bfPhotoThumb","bfPhotoIcon","bfPhotoTxt","bf-body","bf-author","bf-source",
   "blogFormCancel","blogFormSubmit","blogDetailOverlay","blogDetailSheet","f-source",
   "familyBadgeBtn","familyOnboardingOverlay","famTabCreate","famTabJoin","famError",
   "famCreateField","famJoinField","fam-name","fam-code","famSubmit",
   "familyInfoOverlay","famInfoHeading","famInfoClose","famInviteCodeBox","discoverGrid","discoverEmptyState","f-visibility","memoryBanner","plannerView",
   "addToPlannerOverlay","addToPlannerClose","atp-day","atp-slot","atp-servings","atpCancel","atpConfirm",
   "reportOverlay","reportClose","report-reason","reportError","reportCancel","reportConfirm","famCopyLinkBtn","discoverFilters",
   "notifBellBtn","notifCount","notifOverlay","notifClose","notifTabReceived","notifTabSent","notifBody",
   "familyProfileOverlay","familyProfileHeading","familyProfileClose","familyProfileRegion","familyProfileList",
   "requestAccessOverlay","requestAccessClose","requestAccessRecipeName","request-message","requestAccessCancel","requestAccessConfirm"
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
    discoverFamilyQuery: ""
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
        '</div>' +
        '<div class="card-body">' +
          '<p class="card-cat">' + esc(r.category || "Autre") + '</p>' +
          '<h3 class="card-title">' + esc(r.title) + '</h3>' +
          tagsHtml +
          '<div class="card-meta">' +
            (r.prep_min || r.cook_min ? '<span>' + ICON_CLOCK + ' ' + ((num(r.prep_min)+num(r.cook_min)) || "–") + ' min</span>' : '') +
            (r.servings ? '<span>' + ICON_PLATE + ' ' + num(r.servings) + '</span>' : '') +
          '</div>' +
        '</div>';
      card.addEventListener("click", function(){ openDetail(r.id); });
      card.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openDetail(r.id); }
      });
      card.style.setProperty("--cat-color", categoryColor(r.category));
      var favBtn = card.querySelector("[data-fav]");
      favBtn.addEventListener("click", function(e){ e.stopPropagation(); toggleFavorite(r.id); });
      els.grid.appendChild(card);
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
    els.featuredSection.querySelector("[data-featured-open]").addEventListener("click", function(){ openDetail(r.id); });
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
    els.memoryBanner.querySelector("[data-memory-open]").addEventListener("click", function(){ openDetail(r.id); });
  }

  /* ---------------- detail sheet ---------------- */
  function findRecipe(id){
    return state.recipes.filter(function(r){ return r.id === id; })[0];
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
    var actionsHtml = state.session
      ? '<div class="detail-actions">' +
          '<button class="btn" data-edit type="button">Modifier</button>' +
          '<button class="btn" data-add-planner type="button">📅 Ajouter au planificateur</button>' +
          '<button class="btn" data-toggle-visibility type="button">' + (isPublic ? "🔒 Rendre privée" : "🌐 Rendre publique") + '</button>' +
          '<button class="btn btn-danger" data-delete type="button">Supprimer</button>' +
        '</div>'
      : '<p class="signed-out-note">Connecte-toi pour modifier ou supprimer cette recette.</p>';
    var visibilityNote = isPublic
      ? '<p class="detail-visibility-note">🌐 Cette recette est visible par toutes les familles dans l\'onglet Découvrir.</p>'
      : '';

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
      if (newVisibility === "public" && r.source_url && /^https?:\/\//i.test(r.source_url)){
        toast("Impossible : une recette avec un lien externe ne peut pas être rendue publique. Modifie sa provenance pour « Recette personnelle » d'abord.");
        return;
      }
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

  function openFamilyProfile(familyId, familyName, familyRegion){
    els.familyProfileHeading.textContent = "👪 " + familyName;
    els.familyProfileRegion.textContent = familyRegion ? "📍 " + familyRegion : "";
    els.familyProfileList.innerHTML = '<p class="hint">Chargement…</p>';
    els.familyProfileOverlay.hidden = false;

    supabase.from("recipes_browse").select("*").eq("family_id", familyId).then(function(res){
      if (res.error){ els.familyProfileList.innerHTML = '<p class="hint">Impossible de charger les recettes.</p>'; return; }
      var list = sortByDate(res.data || []);
      if (!list.length){ els.familyProfileList.innerHTML = '<p class="hint">Aucune recette à afficher.</p>'; return; }
      els.familyProfileList.innerHTML = list.map(function(r){
        var isPublic = r.visibility === "public";
        var mine = state.recipes.some(function(mr){ return mr.id === r.id; });
        var unlocked = isPublic || mine;
        return '<div class="browse-recipe-row' + (unlocked ? '' : ' locked') + '">' +
          '<span class="browse-title">' + (unlocked ? '' : '🔒 ') + esc(r.title) + '</span>' +
          '<span class="browse-meta">' + esc(r.category || "") + '</span>' +
          (unlocked
            ? '<button type="button" class="btn" data-browse-open="' + r.id + '" data-browse-public="' + isPublic + '">Voir</button>'
            : '<button type="button" class="btn" data-browse-request="' + r.id + '" data-browse-title="' + esc(r.title) + '">Demander l\'accès</button>') +
        '</div>';
      }).join("");

      els.familyProfileList.querySelectorAll("[data-browse-open]").forEach(function(btn){
        btn.addEventListener("click", function(){
          var id = btn.getAttribute("data-browse-open");
          els.familyProfileOverlay.hidden = true;
          if (btn.getAttribute("data-browse-public") === "true") openDiscoverDetail(id);
          else openDetail(id);
        });
      });
      els.familyProfileList.querySelectorAll("[data-browse-request]").forEach(function(btn){
        btn.addEventListener("click", function(){
          openRequestAccess(btn.getAttribute("data-browse-request"), btn.getAttribute("data-browse-title"));
        });
      });
    });
  }
  els.familyProfileClose.addEventListener("click", function(){ els.familyProfileOverlay.hidden = true; });
  els.familyProfileOverlay.addEventListener("click", function(e){ if (e.target === els.familyProfileOverlay) els.familyProfileOverlay.hidden = true; });

  /* ================= DEMANDER L'ACCÈS ================= */

  var pendingRequestRecipeId = null;
  function openRequestAccess(recipeId, recipeTitle){
    if (!state.session){ openAuth("login"); return; }
    pendingRequestRecipeId = recipeId;
    els.requestAccessRecipeName.textContent = "Recette : " + recipeTitle;
    els["request-message"].value = "";
    els.requestAccessOverlay.hidden = false;
  }
  function closeRequestAccess(){ els.requestAccessOverlay.hidden = true; pendingRequestRecipeId = null; }
  els.requestAccessClose.addEventListener("click", closeRequestAccess);
  els.requestAccessCancel.addEventListener("click", closeRequestAccess);
  els.requestAccessOverlay.addEventListener("click", function(e){ if (e.target === els.requestAccessOverlay) closeRequestAccess(); });
  els.requestAccessConfirm.addEventListener("click", function(){
    if (!supabase || !pendingRequestRecipeId || !state.session) return;
    supabase.from("access_requests").insert({
      recipe_id: pendingRequestRecipeId,
      requested_by: state.session.user.id,
      requester_family_id: state.familyId,
      message: els["request-message"].value.trim() || null
    }).then(function(res){
      if (res.error){ toast("La demande n'a pas pu être envoyée — " + res.error.message); return; }
      closeRequestAccess();
      toast("Demande envoyée ! Tu verras la réponse dans tes notifications 🔔.");
    });
  });

  /* ================= BOÎTE DE RÉCEPTION (🔔) ================= */

  var notifTab = "received";
  function loadPendingCount(){
    if (!supabase || !state.familyId) return;
    supabase.from("access_requests")
      .select("id, recipes!inner(family_id)", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("recipes.family_id", state.familyId)
      .then(function(res){
        var n = res.count || 0;
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
        .select("*, recipes!inner(title, family_id), requester:requester_family_id(name)")
        .eq("recipes.family_id", state.familyId)
        .order("created_at", { ascending: false })
        .then(function(res){
          if (res.error){ els.notifBody.innerHTML = '<p class="hint">Impossible de charger les demandes.</p>'; return; }
          var rows = res.data || [];
          if (!rows.length){ els.notifBody.innerHTML = '<p class="hint">Aucune demande reçue pour l\'instant.</p>'; return; }
          els.notifBody.innerHTML = rows.map(function(row){
            var famName = row.requester ? row.requester.name : "Une famille";
            var actions = row.status === "pending"
              ? '<div class="notif-actions"><button class="btn btn-primary" data-approve="' + row.id + '" type="button">Approuver</button><button class="btn" data-decline="' + row.id + '" type="button">Refuser</button></div>'
              : '<span class="notif-status ' + row.status + '">' + (row.status === "approved" ? "Approuvée" : "Refusée") + '</span>';
            return '<div class="notif-item">' +
              '<p><b>' + esc(famName) + '</b> a demandé l\'accès à <b>' + esc(row.recipes.title) + '</b></p>' +
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
        .select("*, recipes(title)")
        .eq("requested_by", state.session.user.id)
        .order("created_at", { ascending: false })
        .then(function(res){
          if (res.error){ els.notifBody.innerHTML = '<p class="hint">Impossible de charger tes demandes.</p>'; return; }
          var rows = res.data || [];
          if (!rows.length){ els.notifBody.innerHTML = '<p class="hint">Tu n\'as envoyé aucune demande pour l\'instant.</p>'; return; }
          els.notifBody.innerHTML = rows.map(function(row){
            var label = row.status === "pending" ? "En attente" : (row.status === "approved" ? "Approuvée" : "Refusée");
            return '<div class="notif-item">' +
              '<p>Demande pour <b>' + esc(row.recipes ? row.recipes.title : "une recette") + '</b></p>' +
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
      if (approve){
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
    }
    els.formOverlay.hidden = false;
    els["f-title"].focus();
  }
  function closeForm(){ els.formOverlay.hidden = true; resetForm(); }

  els.formClose.addEventListener("click", closeForm);
  els.formCancel.addEventListener("click", closeForm);
  els.formOverlay.addEventListener("click", function(e){ if (e.target === els.formOverlay) closeForm(); });

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
    var looksExternal = /^https?:\/\//i.test(sourceVal);
    if (els["f-visibility"].value === "public" && looksExternal){
      showFormError("Une recette avec un lien externe comme provenance ne peut pas être rendue publique — seules les recettes personnelles ou familiales peuvent l'être, pour respecter le droit d'auteur. Garde-la privée, ou change la provenance pour « Recette personnelle ».");
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
    els.importText.value = "";
    els.importSourceUrl.value = "";
    els.importOverlay.hidden = false;
    els.importText.focus();
  });
  function closeImport(){ els.importOverlay.hidden = true; }
  els.importClose.addEventListener("click", closeImport);
  els.importCancel.addEventListener("click", closeImport);
  els.importOverlay.addEventListener("click", function(e){ if (e.target === els.importOverlay) closeImport(); });
  els.importAnalyze.addEventListener("click", function(){
    var text = els.importText.value;
    var sourceUrl = els.importSourceUrl.value.trim();
    if (!text.trim() && !sourceUrl){ closeImport(); return; }
    var parsed = parseRecipeText(text);
    closeImport();
    openForm(null);
    els["f-title"].value = parsed.title;
    els["f-ingredients"].value = parsed.ingredients.join("\n");
    els["f-steps"].value = parsed.steps.join("\n");
    els["f-source"].value = sourceUrl;
    if (parsed.servings) els["f-servings"].value = parsed.servings;
    if (parsed.prep_min) els["f-prep"].value = parsed.prep_min;
    if (parsed.cook_min) els["f-cook"].value = parsed.cook_min;
    toast("Texte analysé — vérifie et complète avant d'enregistrer.");
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

    els.discoverGrid.hidden = !discoverMode;
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
    else if (discoverMode){ renderDiscoverFilters(); renderDiscoverGrid(); loadDiscoverRecipes(); }
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
  }

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
    } else {
      els.familyBadgeBtn.hidden = true;
      if (els.notifBellBtn) els.notifBellBtn.hidden = true;
    }
  }

  els.familyBadgeBtn.addEventListener("click", function(){
    els.famInfoHeading.textContent = state.familyName;
    els.famInviteCodeBox.textContent = state.familyInviteCode || "—";
    els.familyInfoOverlay.hidden = false;
  });
  els.famInfoClose.addEventListener("click", function(){ els.familyInfoOverlay.hidden = true; });
  els.familyInfoOverlay.addEventListener("click", function(e){ if (e.target === els.familyInfoOverlay) els.familyInfoOverlay.hidden = true; });
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

  function enterFamily(id, name, code, isAdmin){
    state.familyId = id;
    state.familyName = name;
    state.familyInviteCode = code || state.familyInviteCode;
    state.isAdminFamily = !!isAdmin;
    renderFamilyBadge();
    els.familyOnboardingOverlay.hidden = true;
    loadRecipes();
    loadDiscoverRecipes();
    loadBlogPosts();
    loadFavorites();
    loadPendingCount();
  }

  els.famSubmit.addEventListener("click", function(){
    if (!supabase) return;
    els.famError.hidden = true;
    els.famSubmit.disabled = true;

    if (state.famOnboardMode === "create"){
      var name = els["fam-name"].value.trim();
      if (!name){ els.famSubmit.disabled = false; return; }
      supabase.rpc("create_family", { family_name: name, family_region: document.getElementById("fam-region").value || null }).then(function(res){
        els.famSubmit.disabled = false;
        if (res.error || !res.data || !res.data.length){
          els.famError.textContent = "Impossible de créer la famille — " + (res.error ? res.error.message : "erreur inconnue");
          els.famError.hidden = false;
          return;
        }
        var row = res.data[0];
        enterFamily(row.family_id, name, row.invite_code);
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
        enterFamily(row.family_id, row.family_name, null);
        toast("Tu as rejoint " + row.family_name + " !");
      });
    }
  });

  function checkFamilyMembership(){
    if (!supabase || !state.session) return;
    supabase.from("family_members").select("family_id, families(name, invite_code, is_admin_family)").eq("user_id", state.session.user.id).then(function(res){
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
      enterFamily(rows[0].family_id, fam ? fam.name : "", fam ? fam.invite_code : "", fam ? fam.is_admin_family : false);
    });
  }

  /* ================= DÉCOUVRIR (recettes publiques) ================= */

  function filteredSortedDiscoverRecipes(){
    var term = state.searchTerm.trim().toLowerCase();
    var famTerm = state.discoverFamilyQuery.trim().toLowerCase();
    var list = state.discoverRecipes.filter(function(r){
      if (state.discoverRegion && (!r.families || r.families.region !== state.discoverRegion)) return false;
      if (state.discoverTag && (!r.tags || r.tags.indexOf(state.discoverTag) === -1)) return false;
      if (famTerm && !(r.families && r.families.name.toLowerCase().indexOf(famTerm) !== -1)) return false;
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
        '<input type="text" id="discoverFamilySearch" placeholder="🔍 Chercher une famille…" value="' + esc(state.discoverFamilyQuery) + '">' +
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

    document.getElementById("discoverFamilySearch").addEventListener("input", function(e){
      state.discoverFamilyQuery = e.target.value;
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
          '<p class="card-cat">' + esc(r.category || "Autre") + ' · <span class="fam-link" data-fam-link>👪 ' + esc(famName) + '</span>' + famRegion + '</p>' +
          '<h3 class="card-title">' + esc(r.title) + '</h3>' +
          tagsHtml +
          '<div class="card-meta">' +
            (r.prep_min || r.cook_min ? '<span>' + ICON_CLOCK + ' ' + ((num(r.prep_min)+num(r.cook_min)) || "–") + ' min</span>' : '') +
            (r.servings ? '<span>' + ICON_PLATE + ' ' + num(r.servings) + '</span>' : '') +
          '</div>' +
        '</div>';
      card.addEventListener("click", function(){ openDiscoverDetail(r.id); });
      card.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openDiscoverDetail(r.id); } });
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
    return state.discoverRecipes.filter(function(r){ return r.id === id; })[0];
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
    supabase.from("meal_plan").select("*").eq("family_id", state.familyId)
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
        var recipe = entry && entry.recipe_id ? state.recipes.filter(function(r){ return r.id === entry.recipe_id; })[0] : null;
        var searchValue = recipe ? recipe.title : "";
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
