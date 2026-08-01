import { configureStore } from "@reduxjs/toolkit";

import { uiReducer } from "@/store/slices/ui-slice";

export function makeStore() {
  return configureStore({
    reducer: {
      ui: uiReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
