import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'time-converter',
    loadComponent: () =>
      import('./tools/time-converter/time-converter.component')
        .then(m => m.TimeConverterComponent),
  },
  {
    path: 'base64-converter',
    loadComponent: () =>
      import('./tools/base64-converter/base64-converter.component')
        .then(m => m.Base64ConverterComponent),
  },
  {
    path: 'json-compare',
    loadComponent: () =>
      import('./tools/json-compare/json-compare.component')
        .then(m => m.JsonCompareComponent),
  },
  {
    path: 'text-utils',
    loadComponent: () =>
      import('./tools/text-utils/text-utils.component')
        .then(m => m.TextUtilsComponent),
  },
  {
    path: 'url-encoder',
    loadComponent: () =>
      import('./tools/url-encoder/url-encoder.component')
        .then(m => m.UrlEncoderComponent),
  },
  {
    path: 'jwt-decoder',
    loadComponent: () =>
      import('./tools/jwt-decoder/jwt-decoder.component')
        .then(m => m.JwtDecoderComponent),
  },
  {
    path: 'hash-generator',
    loadComponent: () =>
      import('./tools/hash-generator/hash-generator.component')
        .then(m => m.HashGeneratorComponent),
  },
  {
    path: 'uuid-generator',
    loadComponent: () =>
      import('./tools/uuid-generator/uuid-generator.component')
        .then(m => m.UuidGeneratorComponent),
  }
];
