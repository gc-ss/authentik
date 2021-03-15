import { gettext } from "django";
import { css, CSSResult, customElement, html, property, TemplateResult } from "lit-element";
import { COMMON_STYLES } from "../../../common/styles";
import { BaseStage } from "../base";
import "../form";
import "../../../elements/utils/LoadingState";
import { Challenge } from "../../../api/Flows";

export const PasswordManagerPrefill: {
    password: string | undefined;
    totp: string | undefined;
} = {
    password: undefined,
    totp: undefined,
};

export interface IdentificationChallenge extends Challenge {

    input_type: string;
    primary_action: string;
    sources?: UILoginButton[];

    application_pre?: string;

    enroll_url?: string;
    recovery_url?: string;

}

export interface UILoginButton {
    name: string;
    url: string;
    icon_url?: string;
}

@customElement("ak-stage-identification")
export class IdentificationStage extends BaseStage {

    @property({attribute: false})
    challenge?: IdentificationChallenge;

    static get styles(): CSSResult[] {
        return COMMON_STYLES.concat(
            css`
                .pf-c-login__main-footer-links-item-link img {
                    width: 100px;
                }
            `
        );
    }

    firstUpdated(): void {
        // This is a workaround for the fact that we're in a shadow dom
        // adapted from https://github.com/home-assistant/frontend/issues/3133
        const username = document.createElement("input");
        username.setAttribute("type", "text");
        username.setAttribute("name", "username"); // username as name for high compatibility
        username.setAttribute("autocomplete", "username");
        username.onkeyup = (ev: Event) => {
            const el = ev.target as HTMLInputElement;
            (this.shadowRoot || this).querySelectorAll<HTMLInputElement>("input[name=uid_field]").forEach(input => {
                input.value = el.value;
                // Because we assume only one input field exists that matches this
                // call focus so the user can press enter
                input.focus();
            });
        };
        document.documentElement.appendChild(username);
        const password = document.createElement("input");
        password.setAttribute("type", "password");
        password.setAttribute("name", "password");
        password.setAttribute("autocomplete", "current-password");
        password.onkeyup = (ev: KeyboardEvent) => {
            if (ev.key == "Enter") {
                this.submitForm(ev);
            }
            const el = ev.target as HTMLInputElement;
            // Because the password field is not actually on this page,
            // and we want to 'prefill' the password for the user,
            // save it globally
            PasswordManagerPrefill.password = el.value;
            // Because password managers fill username, then password,
            // we need to re-focus the uid_field here too
            (this.shadowRoot || this).querySelectorAll<HTMLInputElement>("input[name=uid_field]").forEach(input => {
                // Because we assume only one input field exists that matches this
                // call focus so the user can press enter
                input.focus();
            });
        };
        document.documentElement.appendChild(password);
        const totp = document.createElement("input");
        totp.setAttribute("type", "text");
        totp.setAttribute("name", "code");
        totp.setAttribute("autocomplete", "one-time-code");
        totp.onkeyup = (ev: KeyboardEvent) => {
            if (ev.key == "Enter") {
                this.submitForm(ev);
            }
            const el = ev.target as HTMLInputElement;
            // Because the totp field is not actually on this page,
            // and we want to 'prefill' the totp for the user,
            // save it globally
            PasswordManagerPrefill.totp = el.value;
            // Because totp managers fill username, then password, then optionally,
            // we need to re-focus the uid_field here too
            (this.shadowRoot || this).querySelectorAll<HTMLInputElement>("input[name=uid_field]").forEach(input => {
                // Because we assume only one input field exists that matches this
                // call focus so the user can press enter
                input.focus();
            });
        };
        document.documentElement.appendChild(totp);
    }

    renderSource(source: UILoginButton): TemplateResult {
        let icon = html`<i class="pf-icon pf-icon-arrow" title="${source.name}"></i>`;
        if (source.icon_url) {
            icon = html`<img src="${source.icon_url}" alt="${source.name}">`;
        }
        return html`<li class="pf-c-login__main-footer-links-item">
                <a href="${source.url}" class="pf-c-login__main-footer-links-item-link">
                    ${icon}
                </a>
            </li>`;
    }

    renderFooter(): TemplateResult {
        if (!this.challenge?.enroll_url && !this.challenge?.recovery_url) {
            return html``;
        }
        return html`<div class="pf-c-login__main-footer-band">
                ${this.challenge.enroll_url ? html`
                <p class="pf-c-login__main-footer-band-item">
                    ${gettext("Need an account?")}
                    <a id="enroll" href="${this.challenge.enroll_url}">${gettext("Sign up.")}</a>
                </p>` : html``}
                ${this.challenge.recovery_url ? html`
                <p class="pf-c-login__main-footer-band-item">
                    ${gettext("Need an account?")}
                    <a id="recovery" href="${this.challenge.recovery_url}">${gettext("Forgot username or password?")}</a>
                </p>` : html``}
            </div>`;
    }

    render(): TemplateResult {
        if (!this.challenge) {
            return html`<ak-loading-state></ak-loading-state>`;
        }
        return html`<header class="pf-c-login__main-header">
                <h1 class="pf-c-title pf-m-3xl">
                    ${this.challenge.title}
                </h1>
            </header>
            <div class="pf-c-login__main-body">
                <form class="pf-c-form" @submit=${(e: Event) => {this.submitForm(e);}}>
                    ${this.challenge.application_pre ?
                        html`<p>
                            ${gettext(`Login to continue to ${this.challenge.application_pre}.`)}
                        </p>`:
                        html``}

                    <ak-form-element
                        label="${gettext("Email or Username")}"
                        ?required="${true}"
                        class="pf-c-form__group"
                        .errors=${(this.challenge?.response_errors || {})["uid_field"]}>
                        <input type="text"
                            name="uid_field"
                            placeholder="Email or Username"
                            autofocus=""
                            autocomplete="username"
                            class="pf-c-form-control"
                            required="">
                    </ak-form-element>

                    <div class="pf-c-form__group pf-m-action">
                        <button type="submit" class="pf-c-button pf-m-primary pf-m-block">
                            ${this.challenge.primary_action}
                        </button>
                    </div>
                </form>
            </div>
            <footer class="pf-c-login__main-footer">
                <ul class="pf-c-login__main-footer-links">
                    ${(this.challenge.sources || []).map((source) => {
                        return this.renderSource(source);
                    })}
                </ul>
                ${this.renderFooter()}
            </footer>`;
    }

}