import { FlowsApi, FlowStageBinding, FlowStageBindingPolicyEngineModeEnum, Stage, StagesApi } from "authentik-api";
import { gettext } from "django";
import { customElement, property } from "lit-element";
import { html, TemplateResult } from "lit-html";
import { DEFAULT_CONFIG } from "../../api/Config";
import { Form } from "../../elements/forms/Form";
import { until } from "lit-html/directives/until";
import { ifDefined } from "lit-html/directives/if-defined";
import "../../elements/forms/HorizontalFormElement";
import { groupBy } from "../../utils";

@customElement("ak-stage-binding-form")
export class StageBindingForm extends Form<FlowStageBinding> {

    @property({attribute: false})
    fsb?: FlowStageBinding;

    @property()
    targetPk?: string;

    getSuccessMessage(): string {
        if (this.fsb) {
            return gettext("Successfully updated binding.");
        } else {
            return gettext("Successfully created binding.");
        }
    }

    send = (data: FlowStageBinding): Promise<FlowStageBinding> => {
        if (this.fsb) {
            return new FlowsApi(DEFAULT_CONFIG).flowsBindingsUpdate({
                fsbUuid: this.fsb.pk || "",
                data: data
            });
        } else {
            return new FlowsApi(DEFAULT_CONFIG).flowsBindingsCreate({
                data: data
            });
        }
    };

    groupStages(stages: Stage[]): TemplateResult {
        return html`
            ${groupBy<Stage>(stages, (s => s.verboseName || "")).map(([group, stages]) => {
                return html`<optgroup label=${group}>
                    ${stages.map(stage => {
                        const selected = (this.fsb?.stage === stage.pk);
                        return html`<option ?selected=${selected} value=${ifDefined(stage.pk)}>${stage.name}</option>`;
                    })}
                </optgroup>`;
            })}
        `;
    }

    getOrder(): Promise<number> {
        if (this.fsb) {
            return Promise.resolve(this.fsb.order);
        }
        return new FlowsApi(DEFAULT_CONFIG).flowsBindingsList({
            target: this.targetPk || "",
        }).then(bindings => {
            const orders = bindings.results.map(binding => binding.order);
            return Math.max(...orders) + 1;
        });
    }

    renderTarget(): TemplateResult {
        if (this.fsb?.target || this.targetPk) {
            return html`
            <input required name="target" type="hidden" value=${ifDefined(this.fsb?.target || this.targetPk)}>
            `;
        }
        return html`<ak-form-element-horizontal
            label=${gettext("Target")}
            ?required=${true}
            name="target">
            <select class="pf-c-form-control">
                ${until(new FlowsApi(DEFAULT_CONFIG).flowsInstancesList({
                    ordering: "pk"
                }).then(flows => {
                    return flows.results.map(flow => {
                        // No ?selected check here, as this input isnt shown on update forms
                        return html`<option value=${ifDefined(flow.pk)}>${flow.name}</option>`;
                    });
                }), html``)}
            </select>
        </ak-form-element-horizontal>`;
    }

    renderForm(): TemplateResult {
        return html`<form class="pf-c-form pf-m-horizontal">
            ${this.renderTarget()}
            <ak-form-element-horizontal
                label=${gettext("Stage")}
                ?required=${true}
                name="stage">
                <select class="pf-c-form-control">
                    ${until(new StagesApi(DEFAULT_CONFIG).stagesAllList({
                        ordering: "pk"
                    }).then(stages => {
                        return this.groupStages(stages.results);
                    }), html``)}
                </select>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal name="evaluateOnPlan">
                <div class="pf-c-check">
                    <input type="checkbox" class="pf-c-check__input" ?checked=${this.fsb?.evaluateOnPlan || true}>
                    <label class="pf-c-check__label">
                        ${gettext("Evaluate on plan")}
                    </label>
                </div>
                <p class="pf-c-form__helper-text">${gettext("Evaluate policies during the Flow planning process. Disable this for input-based policies.")}</p>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal name="reEvaluatePolicies">
                <div class="pf-c-check">
                    <input type="checkbox" class="pf-c-check__input" ?checked=${this.fsb?.reEvaluatePolicies || false}>
                    <label class="pf-c-check__label">
                        ${gettext("Re-evaluate policies")}
                    </label>
                </div>
                <p class="pf-c-form__helper-text">${gettext("Evaluate policies when the Stage is present to the user.")}</p>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal
                label=${gettext("Order")}
                ?required=${true}
                name="order">
                <input type="number" value="${until(this.getOrder(), this.fsb?.order)}" class="pf-c-form-control" required>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal
                label=${gettext("Policy engine mode")}
                ?required=${true}
                name="policyEngineMode">
                <select class="pf-c-form-control">
                    <option value=${FlowStageBindingPolicyEngineModeEnum.Any} ?selected=${this.fsb?.policyEngineMode === FlowStageBindingPolicyEngineModeEnum.Any}>
                        ${gettext("ANY, any policy must match to grant access.")}
                    </option>
                    <option value=${FlowStageBindingPolicyEngineModeEnum.All} ?selected=${this.fsb?.policyEngineMode === FlowStageBindingPolicyEngineModeEnum.All}>
                        ${gettext("ALL, all policies must match to grant access.")}
                    </option>
                </select>
            </ak-form-element-horizontal>
        </form>`;
    }

}