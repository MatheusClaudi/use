import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Detectionv1Component } from './pages/detectionv1/detectionv1.component';

const routes: Routes = [
  {path: '', component: Detectionv1Component, pathMatch:'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {

 }
