import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/api/auth.service';
import { AmbientBackground } from '../../shared/ambient/ambient-background';
import { ThemePicker } from '../../shared/theme-picker/theme-picker';

type Mode = 'login' | 'register';

@Component({
  selector: 'sf-auth-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AmbientBackground, ThemePicker],
  template: `
    <sf-ambient-background />

    <div class="auth">
      <section class="hero" aria-hidden="true">
        <span class="mark">財</span>
        <h1 class="hero-title">Money, kept in plain sight.</h1>
        <p class="hero-sub">
          Track every transaction, set budgets that hold, and watch the month take shape —
          in a palette that feels like yours.
        </p>
        <div class="hero-theme">
          <span class="eyebrow">Choose a palette</span>
          <sf-theme-picker />
        </div>
      </section>

      <section class="form-side">
        <div class="card">
          <span class="eyebrow">{{ isRegister() ? 'Create account' : 'Welcome back' }}</span>
          <h2 class="card-title">
            {{ isRegister() ? 'Start tracking' : 'Sign in' }}
          </h2>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            @if (isRegister()) {
              <label class="field">
                <span class="label">Full name</span>
                <input
                  type="text"
                  formControlName="fullName"
                  autocomplete="name"
                  [class.invalid]="invalid('fullName')"
                />
                @if (invalid('fullName')) {
                  <span class="err">Enter your name (2–100 characters).</span>
                }
              </label>
            }

            <label class="field">
              <span class="label">Email</span>
              <input
                type="email"
                formControlName="email"
                autocomplete="email"
                [class.invalid]="invalid('email')"
              />
              @if (invalid('email')) {
                <span class="err">Enter a valid email address.</span>
              }
            </label>

            <label class="field">
              <span class="label">Password</span>
              <input
                type="password"
                formControlName="password"
                [attr.autocomplete]="isRegister() ? 'new-password' : 'current-password'"
                [class.invalid]="invalid('password')"
              />
              @if (invalid('password')) {
                <span class="err">
                  {{ isRegister() ? 'Use at least 8 characters.' : 'Enter your password.' }}
                </span>
              }
            </label>

            @if (error()) {
              <p class="form-error" role="alert">{{ error() }}</p>
            }

            <button type="submit" class="submit" [disabled]="loading()">
              {{ loading() ? 'Just a moment…' : isRegister() ? 'Create account' : 'Sign in' }}
            </button>
          </form>

          <p class="switch">
            @if (isRegister()) {
              Already have an account?
              <a routerLink="/login">Sign in</a>
            } @else {
              New here?
              <a routerLink="/register">Create an account</a>
            }
          </p>
        </div>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      z-index: 1;
    }
    .auth {
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      min-height: 100vh;
    }
    .hero {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 18px;
      padding: 8vh 7vw;
    }
    .mark {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: var(--radius-sf-lg);
      background: var(--color-accent-deep);
      color: var(--color-on-accent);
      font-family: var(--font-display);
      font-size: 28px;
      font-weight: 700;
    }
    .hero-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(30px, 4vw, 46px);
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.02em;
      color: var(--color-ink);
    }
    .hero-sub {
      margin: 0;
      max-width: 42ch;
      color: var(--color-ink-soft);
      font-size: 15px;
      line-height: 1.6;
    }
    .hero-theme {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-side {
      display: grid;
      place-items: center;
      padding: 6vh 5vw;
    }
    .card {
      width: min(420px, 100%);
      padding: 32px;
      background: color-mix(in srgb, var(--color-surface) 92%, transparent);
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf-lg);
      box-shadow: 0 30px 60px -36px color-mix(in srgb, var(--color-ink) 50%, transparent);
      backdrop-filter: blur(6px);
    }
    .card-title {
      margin: 6px 0 22px;
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
      color: var(--color-ink);
    }
    .field {
      display: block;
      margin-bottom: 16px;
    }
    .label {
      display: block;
      margin-bottom: 6px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--color-ink-soft);
    }
    input {
      width: 100%;
      padding: 11px 13px;
      font: inherit;
      font-size: 14px;
      color: var(--color-ink);
      background: var(--color-paper);
      border: 1px solid var(--color-line);
      border-radius: var(--radius-sf);
      transition: border-color 0.18s var(--ease-sf, ease);
    }
    input:focus {
      outline: none;
      border-color: var(--color-accent);
    }
    input.invalid {
      border-color: var(--color-expense);
    }
    .err {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      color: var(--color-expense);
    }
    .form-error {
      margin: 4px 0 14px;
      padding: 10px 12px;
      font-size: 13px;
      color: var(--color-expense);
      background: color-mix(in srgb, var(--color-expense) 10%, transparent);
      border-radius: var(--radius-sf);
    }
    .submit {
      width: 100%;
      padding: 12px;
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      color: var(--color-on-accent);
      background: var(--color-accent-deep);
      border: none;
      border-radius: var(--radius-sf);
      cursor: pointer;
      transition: filter 0.18s var(--ease-sf, ease);
    }
    .submit:hover:not(:disabled) {
      filter: brightness(1.08);
    }
    .submit:disabled {
      opacity: 0.6;
      cursor: progress;
    }
    .switch {
      margin: 18px 0 0;
      text-align: center;
      font-size: 13px;
      color: var(--color-ink-soft);
    }
    .switch a {
      color: var(--color-accent-deep);
      font-weight: 600;
    }
    @media (max-width: 860px) {
      .auth {
        grid-template-columns: 1fr;
      }
      .hero {
        padding: 6vh 7vw 0;
      }
    }
  `,
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from route data via withComponentInputBinding. */
  readonly mode = input<Mode>('login');
  /** Bound from ?redirect= query param. */
  readonly redirect = input<string>('');

  protected readonly isRegister = computed(() => this.mode() === 'register');
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required]],
  });

  protected invalid(name: 'fullName' | 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected submit(): void {
    const register = this.isRegister();
    // Tighten password rule for registration only.
    const pw = this.form.controls.password;
    pw.setValidators(
      register
        ? [Validators.required, Validators.minLength(8), Validators.maxLength(50)]
        : [Validators.required],
    );
    pw.updateValueAndValidity({ emitEvent: false });

    if (register) {
      this.form.controls.fullName.addValidators(Validators.required);
      this.form.controls.fullName.updateValueAndValidity({ emitEvent: false });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const { fullName, email, password } = this.form.getRawValue();
    const call = register
      ? this.auth.register({ fullName, email, password })
      : this.auth.login({ email, password });

    call.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(this.redirect() || '/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          register
            ? 'Could not create your account. That email may already be in use.'
            : 'Sign in failed. Check your email and password.',
        );
        console.error('[auth]', err);
      },
    });
  }
}
