import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-howto-get-started',
  templateUrl: './howto-get-started.component.html',
  styleUrls: ['./howto-get-started.component.scss']
})
export class HowtoGetStartedComponent implements OnInit {

  environment = environment;

  ngOnInit() {}

}
