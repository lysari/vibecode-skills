import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_SECTIONS } from '@app/shared/constants/dashboard';
import { NavSection } from '@app/shared/interfaces/dashboard.interface';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-sidebar',
  styleUrl: './sidebar.scss',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly sections = input<NavSection[]>(NAV_SECTIONS);
}

