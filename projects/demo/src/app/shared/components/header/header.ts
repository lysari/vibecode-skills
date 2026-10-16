import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiquidPressable } from '@app/shared/directives/liquid-press.directive';
import { WORKSPACE_HEADER } from '@app/shared/constants/dashboard';
import { WorkspaceHeaderConfig } from '@app/shared/interfaces/dashboard.interface';

@Component({
  imports: [RouterLink, LiquidPressable],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  readonly config = input<WorkspaceHeaderConfig>(WORKSPACE_HEADER);
}

