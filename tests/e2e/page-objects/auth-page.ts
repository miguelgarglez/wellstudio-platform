import { expect, type Page } from '@playwright/test'

export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login')
  }

  async gotoRegister() {
    await this.page.goto('/register')
  }

  async expectLoginVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Entrena con acceso privado' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('heading', { name: 'Inicia sesión' }),
    ).toBeVisible()
    await expect(this.page.getByLabel('Email')).toBeVisible()
    await expect(this.page.getByLabel('Contraseña')).toBeVisible()
    await expect(
      this.page.getByRole('button', { name: 'Entrar en WellStudio' }),
    ).toBeVisible()
  }

  async expectRegisterVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Empieza tu experiencia boutique' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('heading', { name: 'Crea tu cuenta' }),
    ).toBeVisible()
    await expect(this.page.getByLabel('Nombre')).toBeVisible()
    await expect(this.page.getByLabel('Apellidos')).toBeVisible()
    await expect(this.page.getByLabel('Teléfono')).toBeVisible()
    await expect(this.page.getByLabel('Email')).toBeVisible()
    await expect(this.page.getByLabel('Contraseña')).toBeVisible()
    await expect(
      this.page.getByRole('button', { name: 'Crear acceso en WellStudio' }),
    ).toBeVisible()
  }

  async fillLoginForm(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Contraseña').fill(password)
  }

  async submitLogin() {
    await this.page.getByRole('button', { name: 'Entrar en WellStudio' }).click()
  }
}
