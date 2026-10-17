import { Routes } from '@angular/router';
import { ComponentsDocs } from './components-docs';
import { ChatbotDocs } from './chatbot-docs/chatbot-docs';
import { LiquidAutocompleteDocs } from './liquid-autocomplete-docs/liquid-autocomplete-docs';
import { LiquidButtonDocs } from './liquid-button-docs/liquid-button-docs';
import { LiquidExpandDocs } from './liquid-expand-docs/liquid-expand-docs';
import { LiquidGlassWrapperDocs } from './liquid-glass-wrapper-docs/liquid-glass-wrapper-docs';
import { LiquidInputDocs } from './liquid-input-docs/liquid-input-docs';
import { LiquidInputGroupDocs } from './liquid-input-group-docs/liquid-input-group-docs';
import { LiquidMenuPopupDocs } from './liquid-menu-popup-docs/liquid-menu-popup-docs';
import { LiquidMorphMenuDocs } from './liquid-morph-menu-docs/liquid-morph-menu-docs';
import { LiquidSidebarDocs } from './liquid-sidebar-docs/liquid-sidebar-docs';
import { LiquidSliderDocs } from './liquid-slider-docs/liquid-slider-docs';
import { LiquidStepperDocs } from './liquid-stepper-docs/liquid-stepper-docs';
import { LiquidTabsDocs } from './liquid-tabs-docs/liquid-tabs-docs';
import { LiquidToastDocs } from './liquid-toast-docs/liquid-toast-docs';
import { LiquidToggleDocs } from './liquid-toggle-docs/liquid-toggle-docs';
import { LiquidUploadDocs } from './liquid-upload-docs/liquid-upload-docs';
import { NotificationDocs } from './notification-docs/notification-docs';
import { NumberSlotDocs } from './number-slot-docs/number-slot-docs';
import { PincodeBoxDocs } from './pincode-box-docs/pincode-box-docs';
import { SearchDocs } from './search-docs/search-docs';

export const DOCS_ROUTES: Routes = [
  {
    path: '',
    component: ComponentsDocs,
    children: [
      { path: '', redirectTo: 'liquid-button', pathMatch: 'full' },
      {
        path: 'liquid-button',
        component: LiquidButtonDocs,
        title: 'Liquid Button · Components Workshop',
      },
      {
        path: 'liquid-tabs',
        component: LiquidTabsDocs,
        title: 'Liquid Tabs · Components Workshop',
      },
      {
        path: 'liquid-glass',
        component: LiquidGlassWrapperDocs,
        title: 'Liquid Glass · Components Workshop',
      },
      {
        path: 'liquid-expand',
        component: LiquidExpandDocs,
        title: 'Liquid Expand · Components Workshop',
      },
      {
        path: 'liquid-toggle',
        component: LiquidToggleDocs,
        title: 'Liquid Toggle · Components Workshop',
      },
      {
        path: 'liquid-input',
        component: LiquidInputDocs,
        title: 'Liquid Input · Components Workshop',
      },
      {
        path: 'liquid-input-group',
        component: LiquidInputGroupDocs,
        title: 'Liquid Input Group · Components Workshop',
      },
      {
        path: 'liquid-slider',
        component: LiquidSliderDocs,
        title: 'Liquid Slider · Components Workshop',
      },
      {
        path: 'liquid-autocomplete',
        component: LiquidAutocompleteDocs,
        title: 'Liquid Autocomplete · Components Workshop',
      },
      {
        path: 'liquid-upload',
        component: LiquidUploadDocs,
        title: 'Liquid Upload · Components Workshop',
      },
      {
        path: 'liquid-menu-popup',
        component: LiquidMenuPopupDocs,
        title: 'Liquid Menu Popup · Components Workshop',
      },
      {
        path: 'liquid-morph-menu',
        component: LiquidMorphMenuDocs,
        title: 'Liquid Morph Menu · Components Workshop',
      },
      {
        path: 'liquid-sidebar',
        component: LiquidSidebarDocs,
        title: 'Liquid Sidebar · Components Workshop',
      },
      {
        path: 'search',
        component: SearchDocs,
        title: 'Search · Components Workshop',
      },
      {
        path: 'notification',
        component: NotificationDocs,
        title: 'Notification · Components Workshop',
      },
      {
        path: 'chatbot',
        component: ChatbotDocs,
        title: 'Chatbot · Components Workshop',
      },
      {
        path: 'liquid-toast',
        component: LiquidToastDocs,
        title: 'Liquid Toast · Components Workshop',
      },
      {
        path: 'pincode-box',
        component: PincodeBoxDocs,
        title: 'Pincode Box · Components Workshop',
      },
      {
        path: 'liquid-stepper',
        component: LiquidStepperDocs,
        title: 'Liquid Stepper · Components Workshop',
      },
      {
        path: 'number-slot',
        component: NumberSlotDocs,
        title: 'Number Slot · Components Workshop',
      },
    ],
  },
];

