import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  IPokemon,
  IPokemonType,
  ITableElement,
} from '../../_interfaces/pokemon.interface';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [
    NzTableModule,
    NzPaginationModule,
    NzSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NzMessageModule,
    NzModalModule,
    NzButtonModule,
    NzListModule,
  ],
  templateUrl: './pokemon-list.component.html',
  styleUrl: './pokemon-list.component.scss',
})
export class PokemonListComponent implements OnInit {
  constructor(
    private httpClient: HttpClient,
    private message: NzMessageService
  ) {}

  isVisible = false;
  data = {
    list: [] as IPokemon[],
    pokemonDetail: {} as IPokemon,
    param: {
      totalPages: 0,
      pageSize: 10,
      totalElements: 0,
      pageNumber: 1,
    },
    selectedType: '',
    listType: [] as IPokemonType[],
    imageUrl: '',
  };

  sort = {
    sortFieldName: '',
    direction: '',
  };

  loading = {
    type: false,
    list: false,
    detail: false,
  };

  tableHeader: ITableElement[] = [
    { title: 'number', sort: true },
    { title: 'name' },
    { title: 'type' },
    { title: 'total', sort: true },
    { title: 'hp', sort: true },
    { title: 'attack', sort: true },
    { title: 'defense', sort: true },
    { title: 'sp_atk', sort: true },
    { title: 'sp_def', sort: true },
    { title: 'speed', sort: true },
  ];

  ngOnInit(): void {
    this.getType();
    this.fetchData();
  }

  fetchData(params?: HttpParams) {
    this.loading.list = true;
    const paramsDefault = new HttpParams({
      fromObject: {
        'page[number]': 1,
        'page[size]': 10,
        sort: 'number',
      },
    });
    if (params) {
      params = this.cookingParams(params);
    }

    this.httpClient
      .get('https://api.vandvietnam.com/api/pokemon-api/pokemons', {
        params: params ?? paramsDefault,
      })
      .subscribe(
        (resp: any) => {
          if (resp) {
            this.data.list = resp.data;
            this.data.param.pageSize = resp?.meta.per_page;
            this.data.param.pageNumber = resp?.meta.current_page;
            this.data.param.totalPages = resp?.meta?.last_page ?? 0;
            this.data.param.totalElements = resp?.meta?.total ?? 0;
          }
          this.loading.list = false;
        },
        (error) => {
          this.showError(error);
          this.loading.list = false;
        },
        () => {
          this.loading.list = false;
        }
      );
  }

  cookingParams(params: HttpParams) {
    if (params && this.data.selectedType) {
      params = params.append('filter[type]', this.data.selectedType);
    }
    if (params && this.sort.sortFieldName && this.sort.direction) {
      if (
        this.sort.direction === 'descend' &&
        !this.sort.sortFieldName.startsWith('-')
      ) {
        this.sort.sortFieldName = '-' + this.sort.sortFieldName;
      }
      params = params.append('sort', this.sort.sortFieldName);
    }
    return params;
  }

  getType() {
    this.loading.type = true;
    this.httpClient
      .get('https://api.vandvietnam.com/api/pokemon-api/types')
      .subscribe(
        (resp: any) => {
          if (resp) {
            this.data.listType = resp.data;
          }
        },
        (error) => {
          this.showError(error);
          this.loading.type = false;
        },
        () => {
          this.loading.type = false;
        }
      );
  }

  onQueryParamsChange(evt: NzTableQueryParams | number, type: string) {
    let httpParams = new HttpParams();
    let _params = {
      pageNumber: 1,
      pageSize: 10,
    };
    switch (type) {
      case 'sort':
        const data = evt as NzTableQueryParams;
        const currentSort = data.sort.find((item) => item.value !== null);
        this.sort.sortFieldName = currentSort?.key ?? '';
        this.sort.direction = currentSort?.value ?? '';
        if (this.sort.direction === 'descend') {
          this.sort.sortFieldName = '-' + this.sort.sortFieldName;
        }
        httpParams = httpParams.append('sort', this.sort.sortFieldName);
        break;
      case 'size':
        _params.pageSize = evt as number;
        _params.pageNumber = 1;
        break;
      default:
        _params.pageNumber = evt as number;
        break;
    }
    httpParams = httpParams.append('page[number]', _params.pageNumber);
    httpParams = httpParams.append('page[size]', _params.pageSize);
    this.fetchData(httpParams);
  }

  onSearch(evt: string) {
    let httpParams = new HttpParams();
    if (evt) {
      httpParams = httpParams.append('filter[type]', evt);
    }
    httpParams = httpParams.append('page[number]', 1);
    httpParams = httpParams.append('page[size]', this.data.param.pageSize);
    this.fetchData(httpParams);
  }

  convertType(type_1: number, type_2: number) {
    if (this.data.listType.length) {
      return this.data.listType
        .filter((t) => [type_1, type_2].includes(t.id))
        .map((t) => t.name)
        .join(', ');
    }
    return '';
  }

  showDetail(id: string) {
    this.loading.detail = true;
    this.httpClient
      .get(`https://api.vandvietnam.com/api/pokemon-api/pokemons/${id}`)
      .subscribe(
        (resp: any) => {
          if (resp) {
            this.data.pokemonDetail = resp.data;
            this.data.imageUrl = `https://api.vandvietnam.com/api/pokemon-api/pokemons/${resp.data.id}/sprite`;
          }
        },
        (error) => {
          this.showError(error);
          this.loading.detail = false;
        },
        () => {
          this.loading.detail = false;
          this.isVisible = true;
        }
      );
  }

  onClose() {
    this.isVisible = false;
    this.data.pokemonDetail = {} as IPokemon;
  }

  showSuccess() {
    this.message.success('Success');
  }

  showError(_msg: string) {
    this.message.error(_msg);
  }
}
