import { TestBed } from '@angular/core/testing';

import { TranslationApiService } from './translation-api.service';

describe('TranslationApiService', () => {
  let service: TranslationApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranslationApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
