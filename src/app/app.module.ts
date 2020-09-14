import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Detectionv1Component } from './pages/detectionv1/detectionv1.component';
import { CameracaptureComponent } from './components/cameracapture/cameracapture.component';
import { ToastComponent } from './components/toast/toast.component';


@NgModule({
  declarations: [
    AppComponent,
    Detectionv1Component,
    CameracaptureComponent,
    ToastComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule, 
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
