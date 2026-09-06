(function(){
  "use strict";

  var CATEGORIES = ["Déjeuner","Entrée","Plat principal","Dessert","Pâtisserie","Boisson","Autre"];
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
   "bf-title","bf-photo","bfPhotoDrop","bfPhotoThumb","bfPhotoIcon","bfPhotoTxt","bf-body","bf-author",
   "blogFormCancel","blogFormSubmit","blogDetailOverlay","blogDetailSheet","f-source",
   "familyBadgeBtn","familyOnboardingOverlay","famTabCreate","famTabJoin","famError",
   "famCreateField","famJoinField","fam-name","fam-code","famSubmit",
   "familyInfoOverlay","famInfoClose","famInviteCodeBox","discoverGrid","discoverEmptyState","f-visibility"
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
    famOnboardMode: "create"
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
      var favBtn = card.querySelector("[data-fav]");
      favBtn.addEventListener("click", function(e){ e.stopPropagation(); toggleFavorite(r.id); });
      els.grid.appendChild(card);
    });
  }

  els.searchInput.addEventListener("input", function(e){
    state.searchTerm = e.target.value;
    renderGrid();
    renderFeatured();
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
  }

  /* ---------------- detail sheet ---------------- */
  function findRecipe(id){
    return state.recipes.filter(function(r){ return r.id === id; })[0];
  }

  function openDetail(id){
    var r = findRecipe(id);
    if (!r) return;
    var photoBlock = r.photo_url ? '<img class="detail-photo" src="' + esc(r.photo_url) + '" alt="">' : "";

    var ingHtml = (r.ingredients||[]).map(function(i){ return "<li>" + esc(i) + "</li>"; }).join("");
    var stepHtml = (r.steps||[]).map(function(s){ return "<li>" + esc(s) + "</li>"; }).join("");

    var sourceHtml = r.source_url
      ? (/^https?:\/\//i.test(r.source_url)
          ? '<p class="detail-source">Provenance : <a href="' + esc(r.source_url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.source_url) + ' ↗</a></p>'
          : '<p class="detail-source">Provenance : ' + esc(r.source_url) + '</p>')
      : '';

    var isPublic = r.visibility === "public";
    var actionsHtml = state.session
      ? '<div class="detail-actions">' +
          '<button class="btn" data-edit type="button">Modifier</button>' +
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
        '<div class="detail-cols">' +
          '<div><p class="detail-h">Ingrédients</p><ul class="ing-list">' + ingHtml + '</ul></div>' +
          '<div><p class="detail-h">Étapes</p><ol class="step-list">' + stepHtml + '</ol></div>' +
        '</div>' +
        sourceHtml +
        visibilityNote +
        actionsHtml +
      '</div>';

    els.detailSheet.querySelector("[data-close]").addEventListener("click", closeDetail);
    els.detailSheet.querySelector("[data-fav]").addEventListener("click", function(){ toggleFavorite(r.id); });
    els.detailSheet.querySelector("[data-cook]").addEventListener("click", function(){ openCookMode(r); });
    var editBtn = els.detailSheet.querySelector("[data-edit]");
    var delBtn = els.detailSheet.querySelector("[data-delete]");
    var visBtn = els.detailSheet.querySelector("[data-toggle-visibility]");
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

    els.detailOverlay.hidden = false;
  }
  function closeDetail(){ els.detailOverlay.hidden = true; els.detailSheet.innerHTML = ""; }
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

  /* ---------------- mode cuisine ---------------- */
  var cookState = { recipe: null, index: 0 };

  function renderCook(){
    var r = cookState.recipe;
    if (!r) return;
    var steps = r.steps || [];
    var i = cookState.index;
    var total = steps.length;
    els.cookSheet.innerHTML =
      '<div class="cook-head">' +
        '<span class="cook-title">' + esc(r.title) + '</span>' +
        '<button class="sheet-close" data-cook-close type="button">&times;</button>' +
      '</div>' +
      '<div class="cook-progress">Étape ' + (i + 1) + ' / ' + total + '</div>' +
      '<div class="cook-step">' + esc(steps[i] || "") + '</div>' +
      '<div class="cook-nav">' +
        '<button class="btn" data-cook-prev type="button"' + (i === 0 ? ' disabled' : '') + '>← Précédent</button>' +
        (i < total - 1
          ? '<button class="btn btn-primary" data-cook-next type="button">Suivant →</button>'
          : '<button class="btn btn-primary" data-cook-done type="button">Terminé ✓</button>') +
      '</div>';

    els.cookSheet.querySelector("[data-cook-close]").addEventListener("click", closeCookMode);
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
    renderCook();
    els.cookOverlay.hidden = false;
  }
  function closeCookMode(){
    els.cookOverlay.hidden = true;
    els.cookSheet.innerHTML = "";
    cookState.recipe = null;
  }
  els.cookOverlay.addEventListener("click", function(e){ if (e.target === els.cookOverlay) closeCookMode(); });

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
    if (!lines.length) return { title: "", ingredients: [], steps: [] };

    var hasHeaders = lines.some(function(l){ return IMPORT_HEADER_ING.test(l) || IMPORT_HEADER_STEPS.test(l); });
    var title = lines[0].replace(/^#+\s*/, "");
    var body = lines.slice(1);
    var ingredients = [];
    var steps = [];
    var section = null;

    body.forEach(function(raw){
      if (IMPORT_HEADER_ING.test(raw)){ section = "ing"; return; }
      if (IMPORT_HEADER_STEPS.test(raw)){ section = "steps"; return; }

      var isNumberedStep = /^\d+[.)]\s+(?=[A-Za-zÀ-ÿ])/.test(raw);
      var cleaned = raw.replace(/^[-*•]+\s*/, "").replace(/^\d+[.)]\s+/, "");

      if (isNumberedStep){ steps.push(cleaned); return; }
      if (hasHeaders && section === "ing"){ importSplitIngredientLine(cleaned).forEach(function(x){ ingredients.push(x); }); return; }
      if (hasHeaders && section === "steps"){ steps.push(cleaned); return; }

      if (importLooksLikeIngredient(cleaned)) importSplitIngredientLine(cleaned).forEach(function(x){ ingredients.push(x); });
      else steps.push(cleaned);
    });

    return { title: title, ingredients: ingredients, steps: steps };
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
    toast("Texte analysé — vérifie et complète avant d'enregistrer.");
  });

  /* ================= BLOGUE NUTRITION ================= */

  function switchView(view){
    state.view = view;
    var recipeMode = view === "recipes";
    var discoverMode = view === "discover";
    var blogMode = view === "blog";
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

    els.discoverGrid.hidden = !discoverMode;
    els.discoverEmptyState.hidden = discoverMode ? !!state.discoverRecipes.length : true;

    els.blogList.hidden = !blogMode;
    els.blogEmptyState.hidden = blogMode ? !!state.blogPosts.length : true;

    els.addBtn.hidden = discoverMode;
    els.addBtn.innerHTML = blogMode
      ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg> Nouvel article'
      : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg> Ajouter une recette';

    if (recipeMode){ renderGrid(); renderFeatured(); }
    else if (discoverMode){ renderDiscoverGrid(); loadDiscoverRecipes(); }
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
    var actionsHtml = state.session
      ? '<div class="blog-article-actions">' +
          '<button class="btn" data-blog-edit type="button">Modifier</button>' +
          '<button class="btn btn-danger" data-blog-delete type="button">Supprimer</button>' +
        '</div>'
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
    resetBlogForm();
    if (existing){
      state.editingBlogId = existing.id;
      els.blogFormHeading.textContent = "Modifier l'article";
      els.blogFormSubmit.textContent = "Enregistrer les modifications";
      els["bf-title"].value = existing.title || "";
      els["bf-body"].value = existing.body || "";
      els["bf-author"].value = existing.author || "";
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

  function loadBlogPosts(){
    if (!supabase) return;
    supabase.from("blog_posts").select("*").then(function(res){
      if (res.error) return;
      state.blogPosts = (res.data || []).slice().sort(function(a,b){
        return String(b.created_at||"").localeCompare(String(a.created_at||""));
      });
      if (state.view === "blog") renderBlogList();
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
    } else {
      els.familyBadgeBtn.hidden = true;
    }
  }

  els.familyBadgeBtn.addEventListener("click", function(){
    els.famInfoHeading.textContent = state.familyName;
    els.famInviteCodeBox.textContent = state.familyInviteCode || "—";
    els.familyInfoOverlay.hidden = false;
  });
  els.famInfoClose.addEventListener("click", function(){ els.familyInfoOverlay.hidden = true; });
  els.familyInfoOverlay.addEventListener("click", function(e){ if (e.target === els.familyInfoOverlay) els.familyInfoOverlay.hidden = true; });

  function enterFamily(id, name, code){
    state.familyId = id;
    state.familyName = name;
    state.familyInviteCode = code || state.familyInviteCode;
    renderFamilyBadge();
    els.familyOnboardingOverlay.hidden = true;
    loadRecipes();
    loadDiscoverRecipes();
    loadBlogPosts();
    loadFavorites();
  }

  els.famSubmit.addEventListener("click", function(){
    if (!supabase) return;
    els.famError.hidden = true;
    els.famSubmit.disabled = true;

    if (state.famOnboardMode === "create"){
      var name = els["fam-name"].value.trim();
      if (!name){ els.famSubmit.disabled = false; return; }
      supabase.rpc("create_family", { family_name: name }).then(function(res){
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
    supabase.from("family_members").select("family_id, families(name, invite_code)").eq("user_id", state.session.user.id).then(function(res){
      if (res.error) return;
      var rows = res.data || [];
      if (!rows.length){
        setFamTab("create");
        els["fam-name"].value = "";
        els["fam-code"].value = "";
        els.familyOnboardingOverlay.hidden = false;
        return;
      }
      var fam = rows[0].families;
      enterFamily(rows[0].family_id, fam ? fam.name : "", fam ? fam.invite_code : "");
    });
  }

  /* ================= DÉCOUVRIR (recettes publiques) ================= */

  function renderDiscoverGrid(){
    els.discoverGrid.innerHTML = "";
    if (!state.discoverRecipes.length){
      els.discoverEmptyState.hidden = false;
      return;
    }
    els.discoverEmptyState.hidden = true;
    state.discoverRecipes.forEach(function(r){
      var card = document.createElement("div");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      var photoHtml = r.photo_url
        ? '<img src="' + esc(r.photo_url) + '" alt="" loading="lazy">'
        : '<span class="ph-fallback">' + esc(initialsWord(r.title)) + '</span>';
      var famName = r.families ? r.families.name : "Famille inconnue";
      card.innerHTML =
        '<div class="card-photo">' + photoHtml + '</div>' +
        '<div class="card-body">' +
          '<p class="card-cat">' + esc(r.category || "Autre") + ' · 👪 ' + esc(famName) + '</p>' +
          '<h3 class="card-title">' + esc(r.title) + '</h3>' +
          '<div class="card-meta">' +
            (r.prep_min || r.cook_min ? '<span>' + ICON_CLOCK + ' ' + ((num(r.prep_min)+num(r.cook_min)) || "–") + ' min</span>' : '') +
            (r.servings ? '<span>' + ICON_PLATE + ' ' + num(r.servings) + '</span>' : '') +
          '</div>' +
        '</div>';
      card.addEventListener("click", function(){ openDiscoverDetail(r.id); });
      card.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openDiscoverDetail(r.id); } });
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
    var ingHtml = (r.ingredients||[]).map(function(i){ return "<li>" + esc(i) + "</li>"; }).join("");
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
        '<p class="detail-cat">' + esc(r.category || "Autre") + ' · 👪 Recette de ' + esc(famName) + '</p>' +
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
        '<div class="detail-actions"><button class="btn btn-primary" data-copy type="button">📋 Copier dans mon carnet</button></div>' +
      '</div>';

    els.detailSheet.querySelector("[data-close]").addEventListener("click", closeDetail);
    els.detailSheet.querySelector("[data-copy]").addEventListener("click", function(){ copyRecipeToMyFamily(r); });
    els.detailOverlay.hidden = false;
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
    supabase.from("recipes").select("*, families(name)").eq("visibility", "public").neq("family_id", state.familyId).then(function(res){
      if (res.error){ toast("Impossible de charger Découvrir — " + res.error.message); return; }
      state.discoverRecipes = sortByDate(res.data || []);
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
      if (state.session) checkFamilyMembership();
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
