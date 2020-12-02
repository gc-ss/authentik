import { gettext } from "django";
import { css, CSSResult, customElement, html, LitElement, property, TemplateResult } from "lit-element";
import { COMMON_STYLES } from "../../common/styles";

@customElement("pb-aggregate-card")
export class AggregateCard extends LitElement {
    @property()
    icon?: string;

    @property()
    header?: string;

    @property()
    headerLink?: string;

    static get styles(): CSSResult[] {
        return COMMON_STYLES.concat([css`
            .center-value {
                font-size: var(--pf-global--icon--FontSize--lg);
                text-align: center;
            }
            .subtext {
                font-size: var(--pf-global--FontSize--sm);
            }
        `]);
    }

    renderInner(): TemplateResult {
        return html`<slot></slot>`;
    }

    render(): TemplateResult {
        return html`<div class="pf-c-card pf-c-card-aggregate">
            <div class="pf-c-card__header pf-l-flex pf-m-justify-content-space-between">
                <div class="pf-c-card__header-main">
                    <i class="${this.icon}"></i> ${this.header ? gettext(this.header) : ""}
                </div>
                ${this.headerLink ? html`<a href="${this.headerLink}">
                    <i class="fa fa-external-link-alt"> </i>
                </a>` : ""}
            </div>
            <div class="pf-c-card__body center-value">
                ${this.renderInner()}
            </div>
        </div>`;
    }

}