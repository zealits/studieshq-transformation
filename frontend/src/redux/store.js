import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";

// Import reducers
import authReducer from "./slices/authSlice";
import jobsReducer from "./slices/jobsSlice";
import profileReducer from "./slices/profileSlice";
import proposalReducer from "./reducers/proposalReducer";
import freelancerReducer from "./slices/freelancerSlice";
import uploadReducer from "./slices/uploadSlice";
import userManagementReducer from "./slices/userManagementSlice";
import projectsReducer from "./slices/projectsSlice";
import chatReducer from "./chatSlice";
import paymentReducer from "./slices/paymentSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Only persist auth to avoid storing large amounts of data
};

const rootReducer = combineReducers({
  auth: authReducer,
  jobs: jobsReducer,
  profile: profileReducer,
  proposals: proposalReducer,
  freelancers: freelancerReducer,
  upload: uploadReducer,
  userManagement: userManagementReducer,
  projects: projectsReducer,
  chat: chatReducer,
  payment: paymentReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
