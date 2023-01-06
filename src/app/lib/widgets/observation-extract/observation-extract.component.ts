import { Component, AfterViewInit } from '@angular/core';
import {fhir} from '../../../fhir';
import {Subscription} from 'rxjs';
import {ExtensionsService} from '../../../services/extensions.service';
import {BooleanRadioComponent} from '../boolean-radio/boolean-radio.component';

@Component({
  selector: 'lfb-observation-extract',
  template: `
    <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
      <lfb-label *ngIf="!nolabel"
                 [for]="elementId"
                 [title]="schema.title"
                 [helpMessage]="schema.description"
                 [ngClass]="labelWidthClass+' pl-0 pr-1'"
      ></lfb-label>

      <div class="{{controlWidthClass}} p-0 {{adjustVAlignClass}}">

        <div ngbRadioGroup
             class="btn-group form-check-inline btn-group-sm btn-group-toggle" [ngModel]="value" (ngModelChange)="onBooleanChange($event)">
          <ng-container *ngFor="let option of ['No', 'Yes']" class="radio">
            <label ngbButtonLabel class="btn-outline-success m-auto" [attr.id]="name+'_'+option">
              <input ngbButton [value]="option === 'Yes'" type="radio" [attr.disabled]="schema.readOnly ? '' : null">
              {{option}}
            </label>
          </ng-container>
        </div>
        <div *ngIf="value">
          <div *ngIf="!codePresent" class="row mt-1 ml-auto mr-auto">
            <p class="alert alert-warning mt-1" role="alert">To extract using FHIR Observation based approach requires a code assigned to this item. Please enter a code before setting this field.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: []
})
export class ObservationExtractComponent extends BooleanRadioComponent implements AfterViewInit {
  static extUrl: fhir.uri = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract';
  static seqNum = 0;
  elementId: string;
  subscriptions: Subscription [];
  value: boolean;
  codePresent: boolean;
  adjustVAlignClass = 'd-flex';

  constructor(private extensionsService: ExtensionsService) {
    super();
    this.elementId = 'observationLinkPeriod'+ObservationExtractComponent.seqNum++;
    this.subscriptions = [];
  }

  /**
   * Read extension and initialize properties.
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.extensionsService.extensionsObservable.subscribe(() => {
      const ext = this.getExtension(ObservationExtractComponent.extUrl);
      if(ext) {
        this.value = ext.valueBoolean;
      }
      else {
        this.value = false;
      }
    });
    // Watch code for warning.
    this.formProperty.root.getProperty('code').valueChanges.subscribe((code) => {
      this.codePresent = code?.length > 0 && code[0]?.code?.trim().length > 0;
      this.adjustVAlignClass = !this.codePresent && this.value ? '' : 'd-flex';
      this.updateExtension();
    });
  }

  /**
   * Get extension object.
   */
  getExtension(extUrl: fhir.uri): fhir.Extension {
    const ext = this.extensionsService.getExtensionsByUrl(extUrl);
    return ext && ext.length > 0 ? ext[0] : null;
  }

  /**
   * Handle radio buttons for yes/no.
   * @param event - Angular event.
   */
  onBooleanChange(event: boolean) {
    this.value = event;
    this.adjustVAlignClass = !this.codePresent && this.value ? '' : 'd-flex';
    if(this.value && this.codePresent) {
      this.updateExtension();
    }
    else {
      this.extensionsService.removeExtensionsByUrl(ObservationExtractComponent.extUrl);
    }
  }

  /**
   * Update extension in the form property.
   */
  updateExtension() {
    this.reset(this.createExtension(this.value));
  }


  /**
   * Set the extension if the input has a value, otherwise remove if exists.
   * @param ext - fhir.Extension object representing observation extract.
   */
  reset(ext: fhir.Extension) {
    if(ext.valueBoolean) {
      this.extensionsService.resetExtension(ObservationExtractComponent.extUrl, ext, 'valueBoolean', false);
    }
    else {
      this.extensionsService.removeExtensionsByUrl(ext.url);
    }
  }


  /**
   * Create observation link period extension object
   *
   * @param value - Boolean value.
   */
  createExtension(value: boolean): fhir.Extension {
    return {
      valueBoolean: value,
      url: ObservationExtractComponent.extUrl
    };
  }

}
