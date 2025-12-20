import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, timeout, delay } from 'rxjs/operators';

@Injectable({ 
  providedIn: 'root'
})
export class TranslationApiService {
  private apiUrl = 'http://localhost:5000/api/translate'; 
  
  constructor(private http: HttpClient) {}

  translateText(text: string, sourceLang: string, targetLang: string): Observable<any> {
    const body = {
      q: text,
      source: sourceLang,
      target: targetLang
    };
    
    return this.http.post<any>(this.apiUrl, body).pipe(
      timeout(15000), // Timeout de 15 secondes
      catchError(error => {
        console.error('❌ Erreur API traduction:', error);
        // Retourner le texte original en cas d'erreur
        return of({ 
          translatedText: text, 
          originalText: text, 
          success: false,
          error: error.message 
        });
      })
    );
  }

  translateBatch(texts: string[], targetLang: string, sourceLang: string = 'auto'): Observable<any[]> {
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    
    if (validTexts.length === 0) {
      return of([]);
    }

    console.log(`🔄 Traduction par lots: ${validTexts.length} textes vers ${targetLang}`);

    // Traduire par groupes de 3 avec délai entre les groupes pour éviter le rate limiting
    const batchSize = 3;
    const delayBetweenBatches = 1000; // 1 seconde entre les groupes
    
    const batches = [];
    for (let i = 0; i < validTexts.length; i += batchSize) {
      batches.push(validTexts.slice(i, i + batchSize));
    }

    // Créer des observables pour chaque groupe avec délai
    const batchObservables = batches.map((batch, index) => {
      const translationObservables = batch.map(text => 
        this.translateText(text, sourceLang, targetLang)
      );
      
      // Ajouter un délai progressif entre les groupes
      const delayedBatch = forkJoin(translationObservables).pipe(
        delay(index * delayBetweenBatches)
      );
      
      return delayedBatch;
    });

    return forkJoin(batchObservables).pipe(
      map(results => {
        const flatResults = results.flat();
        console.log(`✅ Traduction par lots terminée: ${flatResults.length} textes`);
        return flatResults;
      }),
      catchError(error => {
        console.error('❌ Erreur traduction par lots:', error);
        // En cas d'erreur, retourner les textes originaux
        return of(validTexts.map(text => ({ 
          translatedText: text, 
          originalText: text, 
          success: false 
        })));
      })
    );
  }

  // Méthode simplifiée avec détection automatique
  translateTextAuto(text: string, targetLang: string): Observable<any> {
    return this.translateText(text, 'auto', targetLang);
  }
}