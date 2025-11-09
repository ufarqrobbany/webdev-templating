import {
  // Inject, // <-- Hapus
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
// import { ConfigType } from '@nestjs/config'; // <-- Hapus
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
// import viewConfig from 'src/config/view.config'; // <-- Hapus

@Injectable()
export class ViewService {
  private readonly activeTheme: string = 'default'; // <-- Hardcode di sini
  private readonly defaultTheme = 'default';
  private readonly themesDir = path.join(process.cwd(), 'themes');

  constructor() {
    // <-- Hapus semua isi constructor
    // @Inject(viewConfig.KEY) // <-- Hapus
    // private config: ConfigType<typeof viewConfig>, // <-- Hapus
    // this.activeTheme = this.config.activeTheme; // <-- Hapus
  }

  // (a) Abstraksi: Controller hanya akan memanggil fungsi ini
  public render(
    res: Response,
    viewPath: string,
    data: Record<string, any> = {},
  ): void {
    const resolvedViewPath = this.resolveViewPath(viewPath);
    // Izinkan override layout lewat 'data.layout'. Jika tidak ada, pakai 'layouts/main'.
    const defaultLayoutPath = this.resolveViewPath('layouts/main', false);
    const layoutPath = data.layout ? data.layout : defaultLayoutPath;

    const fullData = {
      ...data,
      layout: layoutPath, // Memberi tahu HBS layout mana yang harus digunakan
      year: new Date().getFullYear(),
    };

    // Memanggil fungsi render Express/HBS yang sebenarnya
    res.render(resolvedViewPath, fullData, (err, html) => {
      if (err)
        throw new InternalServerErrorException(
          `Gagal merender view: ${err.message}`,
        );
      res.send(html);
    });
  }

  // (d) Logika Fallback Theme System
  public resolveViewPath(viewPath: string, withExtension = true): string {
    // Always check for the .hbs file on disk. When withExtension=false we still
    // verify existence using the .hbs extension but return the path without
    // extension because view engines (layouts) often expect a logical name.
    const checkExt = '.hbs';
    const activePath = path.join(
      this.themesDir,
      this.activeTheme, // <-- Ini sekarang selalu 'default'
      'views',
      `${viewPath}${checkExt}`,
    );

    // 1. Cek di tema aktif
    if (fs.existsSync(activePath)) {
      return withExtension
        ? path.join(this.activeTheme, 'views', `${viewPath}${checkExt}`)
        : path.join(this.activeTheme, 'views', viewPath);
    }

    // 2. Jika tidak ada, cek di tema default
    // (Logika ini tetap aman, meskipun activeTheme dan defaultTheme sama)
    const defaultPath = path.join(
      this.themesDir,
      this.defaultTheme,
      'views',
      `${viewPath}${checkExt}`,
    );
    if (fs.existsSync(defaultPath)) {
      return withExtension
        ? path.join(this.defaultTheme, 'views', `${viewPath}${checkExt}`)
        : path.join(this.defaultTheme, 'views', viewPath);
    }

    throw new Error(`View not found: ${viewPath}`);
  }

  // (d) Logika Fallback untuk Aset (CSS/JS)
  public getActiveThemeAssetPath(): string {
    const activeAssetPath = path.join(
      this.themesDir,
      this.activeTheme, // <-- Ini sekarang selalu 'default'
      'assets',
    );
    if (fs.existsSync(activeAssetPath)) {
      return activeAssetPath;
    }
    return path.join(this.themesDir, this.defaultTheme, 'assets');
  }
}
