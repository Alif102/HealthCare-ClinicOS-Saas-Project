import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  sidebarOpen: boolean;
};

const initialState: UiState = {
  sidebarOpen: true,
};

/**
 * UI-only state. Server/domain data belongs in Server Components,
 * Server Actions, and the database — not mirrored here.
 */
export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { setSidebarOpen, toggleSidebar } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
