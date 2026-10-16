import { Component, input } from '@angular/core';
import { WORKSPACE_HEADER } from '@app/shared/constants/dashboard';
import { WorkspaceHeaderConfig } from '@app/shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  readonly config = input<WorkspaceHeaderConfig>(WORKSPACE_HEADER);
}

