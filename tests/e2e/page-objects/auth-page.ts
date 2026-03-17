import { expect, type Page } from '@playwright/test'

export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login')
  }

  async gotoRegister() {
    await this.page.goto('/register')
  }

  async gotoForgotPassword() {
    await this.page.goto('/forgot-password')
  }

  async gotoPrivacyPolicy() {
    await this.page.goto('/privacy-policy')
  }

  async gotoResetPassword() {
    await this.page.goto('/reset-password')
  }

  async gotoTerms() {
    await this.page.goto('/terms')
  }

  async gotoAuthCallback(email = 'maria@wellstudio.test') {
    await this.page.goto(`/auth/callback?next=/app&email=${encodeURIComponent(email)}`)
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
    await expect(
      this.page.getByRole('link', { name: 'Recuperar acceso por email' }),
    ).toBeVisible()
  }

  async expectConfirmedLoginFallback(email: string) {
    await expect(this.page).toHaveURL(
      new RegExp(`/login\\?redirectTo=%2Fapp&authStatus=confirmed&email=${encodeURIComponent(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    )
    await expect(
      this.page.getByText(
        'Tu correo ya está confirmado. Si no te hemos abierto la sesión automáticamente, entra con tu contraseña y continúa.',
      ),
    ).toBeVisible()
    await expect(this.page.getByLabel('Email')).toHaveValue(email)
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
    await expect(
      this.page.getByText(
        'Lo usamos para poder darte un trato más cercano y ayudarte también por WhatsApp si hace falta.',
      ),
    ).toBeVisible()
    await expect(
      this.page.getByRole('link', { name: 'política de privacidad' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('link', { name: 'condiciones de uso' }),
    ).toBeVisible()
  }

  async fillLoginForm(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Contraseña').fill(password)
  }

  async expectForgotPasswordVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Vuelve a entrar con calma' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('heading', { name: 'Restablece tu contraseña' }),
    ).toBeVisible()
    await expect(this.page.getByLabel('Email')).toBeVisible()
    await expect(
      this.page.getByRole('button', { name: 'Enviar enlace de recuperación' }),
    ).toBeVisible()
  }

  async expectResetPasswordInvalidState() {
    await expect(
      this.page.getByRole('heading', { name: 'Solicita uno nuevo' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('link', { name: 'Pedir un nuevo enlace' }),
    ).toBeVisible()
  }

  async expectPrivacyPolicyVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Política de privacidad' }),
    ).toBeVisible()
    await expect(
      this.page.getByText('WellStudio es responsable del tratamiento de los datos personales'),
    ).toBeVisible()
    await expect(
      this.page.getByLabel('Legal navigation').getByRole('link', { name: 'Condiciones' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('complementary').getByRole('link', { name: 'miguel.garglez@gmail.com' }),
    ).toBeVisible()
  }

  async expectTermsVisible() {
    await expect(
      this.page.getByRole('heading', { name: 'Condiciones de uso' }),
    ).toBeVisible()
    await expect(
      this.page.getByText('Estas condiciones regulan el acceso y el uso básico del área privada de WellStudio'),
    ).toBeVisible()
    await expect(
      this.page.getByLabel('Legal navigation').getByRole('link', { name: 'Privacidad' }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('complementary').getByRole('link', { name: 'miguel.garglez@gmail.com' }),
    ).toBeVisible()
  }

  async fillRegisterForm(input: {
    firstName: string
    lastName: string
    phone: string
    email: string
    password: string
  }) {
    await this.page.getByLabel('Nombre').fill(input.firstName)
    await this.page.getByLabel('Apellidos').fill(input.lastName)
    await this.page.getByLabel('Teléfono').fill(input.phone)
    await this.page.getByLabel('Email').fill(input.email)
    await this.page.getByLabel('Contraseña').fill(input.password)
    await this.page.getByRole('checkbox').click()
  }

  async submitLogin() {
    await this.page.getByRole('button', { name: 'Entrar en WellStudio' }).click()
  }

  async submitRegister() {
    await this.page.getByRole('button', { name: 'Crear acceso en WellStudio' }).click()
  }

  async logout() {
    await this.page.getByRole('button', { name: 'Cerrar sesión' }).click()
  }

  async expectInvalidLoginFeedback() {
    await expect(
      this.page.getByText(
        'No hemos podido iniciar tu sesión. Revisa tus credenciales o recupera el acceso con nuestro equipo.',
      ),
    ).toBeVisible()
  }

  async expectProtectedMemberShell() {
    await expect(
      this.page.getByRole('heading', { name: 'Member App' }),
    ).toBeVisible()
    await expect(
      this.page.getByText('Sesión protegida activa'),
    ).toBeVisible()
    await expect(
      this.page.getByText('Roles'),
    ).toBeVisible()
    await expect(
      this.page.getByText('MEMBER', { exact: true }),
    ).toBeVisible()
  }

  async expectRegisterConfirmationFeedback() {
    await expect(
      this.page.getByRole('heading', { name: 'Activa tu cuenta' }),
    ).toBeVisible()
    await expect(
      this.page.getByText(
        'Ya hemos preparado tu acceso. Solo te falta confirmar el correo para entrar en tu espacio privado.',
      ),
    ).toBeVisible()
    await expect(
      this.page.getByText(
        'Abre el correo y confirma tu acceso. Si todo va bien, entrarás directamente en tu espacio privado. Si no lo ves enseguida, revisa spam o promociones.',
      ),
    ).toBeVisible()
    await expect(
      this.page.getByRole('button', {
        name: 'Cambiar el email o volver al formulario',
      }),
    ).toBeVisible()
  }

  async expectRegisterConfirmationEmail(email: string) {
    await expect(
      this.page.getByText(email),
    ).toBeVisible()
  }
}
