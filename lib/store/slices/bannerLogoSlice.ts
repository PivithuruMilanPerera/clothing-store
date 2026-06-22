import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BrandLogo, HeroSlide, LandingContent } from "@/lib/types";

export type BannerLogoTab = "banners" | "logos";

type BannerLogoState = {
  heroSlides: HeroSlide[];
  brandLogos: BrandLogo[];
  activeTab: BannerLogoTab;
  editingHeroSlideId: string | null;
  editingBrandLogoId: string | null;
  isSaving: boolean;
  saveMessage: string | null;
  saveError: string | null;
};

const initialState: BannerLogoState = {
  heroSlides: [],
  brandLogos: [],
  activeTab: "banners",
  editingHeroSlideId: null,
  editingBrandLogoId: null,
  isSaving: false,
  saveMessage: null,
  saveError: null,
};

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

const bannerLogoSlice = createSlice({
  name: "bannerLogo",
  initialState,
  reducers: {
    initializeContent(state, action: PayloadAction<LandingContent>) {
      state.heroSlides = action.payload.heroSlides;
      state.brandLogos = action.payload.brandLogos;
      state.saveMessage = null;
      state.saveError = null;
    },
    setActiveTab(state, action: PayloadAction<BannerLogoTab>) {
      state.activeTab = action.payload;
      state.editingHeroSlideId = null;
      state.editingBrandLogoId = null;
    },
    setEditingHeroSlide(state, action: PayloadAction<string | null>) {
      state.editingHeroSlideId = action.payload;
      state.editingBrandLogoId = null;
    },
    setEditingBrandLogo(state, action: PayloadAction<string | null>) {
      state.editingBrandLogoId = action.payload;
      state.editingHeroSlideId = null;
    },
    updateHeroSlide(
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<Omit<HeroSlide, "cta">> & {
          cta?: Partial<HeroSlide["cta"]>;
        };
      }>,
    ) {
      const slide = state.heroSlides.find((item) => item.id === action.payload.id);
      if (!slide) return;

      Object.assign(slide, action.payload.changes);

      if (action.payload.changes.cta) {
        slide.cta = { ...slide.cta, ...action.payload.changes.cta };
      }
    },
    addHeroSlide(state) {
      const id = createId("hero");
      state.heroSlides.push({
        id,
        image: "",
        mobileImage: "",
      });
      state.editingHeroSlideId = id;
    },
    removeHeroSlide(state, action: PayloadAction<string>) {
      state.heroSlides = state.heroSlides.filter(
        (slide) => slide.id !== action.payload,
      );
      if (state.editingHeroSlideId === action.payload) {
        state.editingHeroSlideId = null;
      }
    },
    updateBrandLogo(
      state,
      action: PayloadAction<{ id: string; changes: Partial<BrandLogo> }>,
    ) {
      const logo = state.brandLogos.find((item) => item.id === action.payload.id);
      if (!logo) return;

      Object.assign(logo, action.payload.changes);
    },
    addBrandLogo(state) {
      const id = createId("brand");
      state.brandLogos.push({
        id,
        name: "",
        image: "",
      });
      state.editingBrandLogoId = id;
    },
    removeBrandLogo(state, action: PayloadAction<string>) {
      state.brandLogos = state.brandLogos.filter(
        (logo) => logo.id !== action.payload,
      );
      if (state.editingBrandLogoId === action.payload) {
        state.editingBrandLogoId = null;
      }
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload;
    },
    setSaveResult(
      state,
      action: PayloadAction<{ success?: string; error?: string }>,
    ) {
      state.saveMessage = action.payload.success ?? null;
      state.saveError = action.payload.error ?? null;
    },
    clearSaveResult(state) {
      state.saveMessage = null;
      state.saveError = null;
    },
  },
});

export const {
  initializeContent,
  setActiveTab,
  setEditingHeroSlide,
  setEditingBrandLogo,
  updateHeroSlide,
  addHeroSlide,
  removeHeroSlide,
  updateBrandLogo,
  addBrandLogo,
  removeBrandLogo,
  setSaving,
  setSaveResult,
  clearSaveResult,
} = bannerLogoSlice.actions;

export const bannerLogoReducer = bannerLogoSlice.reducer;
