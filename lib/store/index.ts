import { configureStore } from "@reduxjs/toolkit";
import { bannerLogoReducer } from "@/lib/store/slices/bannerLogoSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      bannerLogo: bannerLogoReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
