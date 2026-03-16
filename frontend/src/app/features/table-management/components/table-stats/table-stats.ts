import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-stats',
  imports: [],
  templateUrl: './table-stats.html',
})
export class TableStats {
  @Input() total = 0;
  @Input() available = 0;
  @Input() occupied = 0;
}
