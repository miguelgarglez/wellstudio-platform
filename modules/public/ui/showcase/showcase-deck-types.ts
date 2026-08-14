export type DeckSlideKind = 'hero' | 'copy' | 'journey' | 'outcome' | 'cta'

export type DeckSlide = {
  id: string
  eyebrow: string
  title: string
  body: string
  kind: DeckSlideKind
  bullets?: string[]
  demoPlaceholder?: string
}
