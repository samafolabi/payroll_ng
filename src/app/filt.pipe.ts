import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filt',
    pure: false
})
export class FiltPipe implements PipeTransform {
    transform(items: any[]): any {
        if (!items) {
            return items;
        }
        // filter items array, items which match and return true will be
        // kept, false will be filtered out
        return items.filter(item => item.deactivated != true);
    }
}