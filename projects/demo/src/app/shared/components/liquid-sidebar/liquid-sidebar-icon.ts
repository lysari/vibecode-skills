import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * Native vector glyphs matching the platform design system's exact navigation icons.
 * Replaces external icon fonts to guarantee zero missing glyphs or broken fills.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  selector: 'x-liquid-sidebar-icon',
  host: {
    class: 'liquid-sidebar-icon-host',
    '[attr.aria-hidden]': '"true"',
  },
  template: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      @switch (name()) {
        @case ('home') {
          <path d="M9.07874 16.1354H14.8937" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2.40002 13.713C2.40002 8.082 3.01402 8.475 6.31902 5.41C7.76502 4.246 10.015 2 11.958 2C13.9 2 16.195 4.235 17.654 5.41C20.959 8.475 21.572 8.082 21.572 13.713C21.572 22 19.613 22 11.986 22C4.35903 22 2.40002 22 2.40002 13.713Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('monitoring') {
          <path d="M6.91711 14.8539L9.91011 10.9649L13.3241 13.6449L16.2531 9.86487" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M19.6671 2.34998C20.7291 2.34998 21.5891 3.20998 21.5891 4.27198C21.5891 5.33298 20.7291 6.19398 19.6671 6.19398C18.6051 6.19398 17.7451 5.33298 17.7451 4.27198C17.7451 3.20998 18.6051 2.34998 19.6671 2.34998Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M20.7555 9.26898C20.8885 10.164 20.9495 11.172 20.9495 12.303C20.9495 19.241 18.6375 21.553 11.6995 21.553C4.76246 21.553 2.44946 19.241 2.44946 12.303C2.44946 5.36598 4.76246 3.05298 11.6995 3.05298C12.8095 3.05298 13.8005 3.11198 14.6825 3.23998" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('environments') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0004 6.6738C21.0004 8.7024 19.3552 10.3476 17.3266 10.3476C15.298 10.3476 13.6537 8.7024 13.6537 6.6738C13.6537 4.6452 15.298 3 17.3266 3C19.3552 3 21.0004 4.6452 21.0004 6.6738Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3467 6.6738C10.3467 8.7024 8.7024 10.3476 6.6729 10.3476C4.6452 10.3476 3 8.7024 3 6.6738C3 4.6452 4.6452 3 6.6729 3C8.7024 3 10.3467 4.6452 10.3467 6.6738Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0004 17.2619C21.0004 19.2905 19.3552 20.9348 17.3266 20.9348C15.298 20.9348 13.6537 19.2905 13.6537 17.2619C13.6537 15.2333 15.298 13.5881 17.3266 13.5881C19.3552 13.5881 21.0004 15.2333 21.0004 17.2619Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3467 17.2619C10.3467 19.2905 8.7024 20.9348 6.6729 20.9348C4.6452 20.9348 3 19.2905 3 17.2619C3 15.2333 4.6452 13.5881 6.6729 13.5881C8.7024 13.5881 10.3467 15.2333 10.3467 17.2619Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('integrations') {
          <path d="M6.979 4.60132V17.2193" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2.8999 8.69998C2.8999 8.69998 5.0689 4.59998 6.9779 4.59998C8.8859 4.59998 11.0559 8.69998 11.0559 8.69998" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16.9058 19.4274V6.80945" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M20.9849 15.3284C20.9849 15.3284 18.8149 19.4284 16.9069 19.4284C14.9989 19.4284 12.8289 15.3284 12.8289 15.3284" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('settings') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 9.5C13.3809 9.5 14.5 10.6191 14.5 12C14.5 13.3809 13.3809 14.5 12 14.5C10.6191 14.5 9.5 13.3809 9.5 12C9.5 10.6191 10.6191 9.5 12 9.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M20.168 7.25025V7.25025C19.4845 6.05799 17.9712 5.65004 16.7885 6.33852C15.7598 6.93613 14.4741 6.18838 14.4741 4.99218C14.4741 3.61619 13.3659 2.5 11.9998 2.5V2.5C10.6337 2.5 9.52546 3.61619 9.52546 4.99218C9.52546 6.18838 8.23977 6.93613 7.21199 6.33852C6.02829 5.65004 4.51507 6.05799 3.83153 7.25025C3.14896 8.4425 3.55399 9.96665 4.73769 10.6541C5.76546 11.2527 5.76546 12.7473 4.73769 13.3459C3.55399 14.0343 3.14896 15.5585 3.83153 16.7498C4.51507 17.942 6.02829 18.35 7.21101 17.6625H7.21199C8.23977 17.0639 9.52546 17.8116 9.52546 19.0078V19.0078C9.52546 20.3838 10.6337 21.5 11.9998 21.5V21.5C13.3659 21.5 14.4741 20.3838 14.4741 19.0078V19.0078C14.4741 17.8116 15.7598 17.0639 16.7885 17.6625C17.9712 18.35 19.4845 17.942 20.168 16.7498C20.8515 15.5585 20.4455 14.0343 19.2628 13.3459H19.2618C18.2341 12.7473 18.2341 11.2527 19.2628 10.6541C20.4455 9.96665 20.8515 8.4425 20.168 7.25025Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('grid') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0004 6.6738C21.0004 8.7024 19.3552 10.3476 17.3266 10.3476C15.298 10.3476 13.6537 8.7024 13.6537 6.6738C13.6537 4.6452 15.298 3 17.3266 3C19.3552 3 21.0004 4.6452 21.0004 6.6738Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3467 6.6738C10.3467 8.7024 8.7024 10.3476 6.6729 10.3476C4.6452 10.3476 3 8.7024 3 6.6738C3 4.6452 4.6452 3 6.6729 3C8.7024 3 10.3467 4.6452 10.3467 6.6738Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0004 17.2619C21.0004 19.2905 19.3552 20.9348 17.3266 20.9348C15.298 20.9348 13.6537 19.2905 13.6537 17.2619C13.6537 15.2333 15.298 13.5881 17.3266 13.5881C19.3552 13.5881 21.0004 15.2333 21.0004 17.2619Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3467 17.2619C10.3467 19.2905 8.7024 20.9348 6.6729 20.9348C4.6452 20.9348 3 19.2905 3 17.2619C3 15.2333 4.6452 13.5881 6.6729 13.5881C8.7024 13.5881 10.3467 15.2333 10.3467 17.2619Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('star') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.6815 9.72949C21.2945 8.08349 19.5765 7.99849 18.1955 7.92949C17.3265 7.88549 16.4275 7.84149 16.0515 7.45249C15.6685 7.05649 15.3695 6.29749 15.0785 5.56349C14.5115 4.12749 13.8685 2.50049 12.2495 2.50049C10.6315 2.50049 9.98953 4.12749 9.42153 5.56349C9.13153 6.29749 8.83153 7.05649 8.44953 7.45249C8.07253 7.84149 7.17353 7.88549 6.30453 7.92949C4.92353 7.99849 3.20553 8.08349 2.81853 9.72949C2.45153 11.2915 3.59853 12.2365 4.61053 13.0705C5.30253 13.6405 5.95653 14.1805 6.10153 14.8405C6.24253 15.4815 6.03053 16.3095 5.82553 17.1115C5.47353 18.4905 5.07353 20.0525 6.40853 21.0595C6.82553 21.3745 7.24853 21.4995 7.66653 21.4995C8.57153 21.4995 9.45353 20.9155 10.2085 20.4155C10.9075 19.9535 11.6305 19.4745 12.2495 19.4745C12.8685 19.4745 13.5925 19.9535 14.2905 20.4155C15.3955 21.1465 16.7695 22.0545 18.0925 21.0595C19.4275 20.0525 19.0275 18.4895 18.6745 17.1095C18.4695 16.3085 18.2585 15.4805 18.3985 14.8405C18.5435 14.1805 19.1975 13.6415 19.8895 13.0705C20.9015 12.2365 22.0485 11.2915 21.6815 9.72949Z" fill="currentColor"/>
        }
        @case ('cube') {
          <path d="M11.9612 16.5168V13.8888" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21.0895 11.4777L21.0605 11.4987C18.6385 12.9907 15.4405 13.8917 11.9565 13.8917C8.47252 13.8917 5.28352 12.9907 2.86252 11.4987L2.83252 11.4777" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2.75024 13.3507C2.75024 7.19871 5.05324 5.14771 11.9612 5.14771C18.8702 5.14771 21.1722 7.19871 21.1722 13.3507C21.1722 19.5027 18.8702 21.5537 11.9612 21.5537C5.05324 21.5537 2.75024 19.5027 2.75024 13.3507Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15.2237 5.36932V4.73932C15.2237 3.47532 14.3007 2.45032 13.1637 2.45032H10.7587C9.62173 2.45032 8.69873 3.47532 8.69873 4.73932V5.36932" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('history') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.2498 12.0001C21.2498 17.1081 17.1088 21.2501 11.9998 21.2501C6.89176 21.2501 2.74976 17.1081 2.74976 12.0001C2.74976 6.89112 6.89176 2.75012 11.9998 2.75012C17.1088 2.75012 21.2498 6.89112 21.2498 12.0001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16.1906 12.7672L11.6606 12.6932V7.84619" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('mask') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9844 21.6057C14.3194 21.6057 19.6564 19.2837 19.6564 12.8787C19.6564 6.47473 19.9344 5.97373 19.3194 5.35773C18.7034 4.74173 15.4934 2.75073 11.9844 2.75073C8.47544 2.75073 5.26544 4.74173 4.65044 5.35773C4.03444 5.97373 4.31244 6.47473 4.31244 12.8787C4.31244 19.2837 9.65044 21.6057 11.9844 21.6057Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.38586 11.8749L11.2779 13.7699L15.1759 9.86987" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('api') {
          <path d="M15.5957 15.6964H8.37573" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15.5957 11.9366H8.37573" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M11.131 8.17737H8.37598" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M3.60999 12.0001C3.60999 18.9371 5.70798 21.2501 12.001 21.2501C18.295 21.2501 20.392 18.9371 20.392 12.0001C20.392 5.06312 18.295 2.75012 12.001 2.75012C5.70798 2.75012 3.60999 5.06312 3.60999 12.0001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('key') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.6889 12.0001C10.6889 13.0231 9.85986 13.8521 8.83686 13.8521C7.81386 13.8521 6.98486 13.0231 6.98486 12.0001C6.98486 10.9771 7.81386 10.1481 8.83686 10.1481H8.83986C9.86186 10.1491 10.6889 10.9781 10.6889 12.0001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10.6919 12.0001H17.0099V13.8521" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14.1821 13.8521V12.0001" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2.75 12.0001C2.75 5.06312 5.063 2.75012 12 2.75012C18.937 2.75012 21.25 5.06312 21.25 12.0001C21.25 18.9371 18.937 21.2501 12 21.2501C5.063 21.2501 2.75 18.9371 2.75 12.0001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('search') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M11.2754 2.71423C16.003 2.71423 19.8364 6.54661 19.8364 11.2752C19.8364 16.0038 16.003 19.8361 11.2754 19.8361C6.54686 19.8361 2.71448 16.0038 2.71448 11.2752C2.71448 6.54661 6.54686 2.71423 11.2754 2.71423Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M19.899 18.4875C20.678 18.4875 21.3095 19.1199 21.3095 19.898C21.3095 20.678 20.678 21.3095 19.899 21.3095C19.1199 21.3095 18.4875 20.678 18.4875 19.898C18.4875 19.1199 19.1199 18.4875 19.899 18.4875Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('branch') {
          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0004 6.6738C21.0004 8.7024 19.3552 10.3476 17.3266 10.3476C15.298 10.3476 13.6537 8.7024 13.6537 6.6738C13.6537 4.6452 15.298 3 17.3266 3C19.3552 3 21.0004 4.6452 21.0004 6.6738Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3467 17.2619C10.3467 19.2905 8.7024 20.9348 6.6729 20.9348C4.6452 20.9348 3 19.2905 3 17.2619C3 15.2333 4.6452 13.5881 6.6729 13.5881C8.7024 13.5881 10.3467 15.2333 10.3467 17.2619Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('chevron') {
          <path d="M19 8.5C19 8.5 14.856 15.5 12 15.5C9.145 15.5 5 8.5 5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('chevron-down') {
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('plus') {
          <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('folder') {
          <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('database') {
          <path d="M12 3C7.58172 3 4 4.34315 4 6C4 7.65685 7.58172 9 12 9C16.4183 9 20 7.65685 20 6C20 4.34315 16.4183 3 12 3Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 6V12C4 13.6569 7.58172 15 12 15C16.4183 15 20 13.6569 20 12V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 12V18C4 19.6569 7.58172 21 12 21C16.4183 21 20 19.6569 20 18V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('user') {
          <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('bell') {
          <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @default {
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        }
      }
    </svg>
  `,
})
export class LiquidSidebarIcon {
  readonly name = input.required<string>();
}

