interface SetOnboardingWizardStepAction {
  type: 'SET_ONBOARDING_WIZARD_STEP';
  step: number;
}

/**
 * Sets onboarding wizard step
 */
export default function setOnboardingWizardStep(step: number): SetOnboardingWizardStepAction {
  return {
    type: 'SET_ONBOARDING_WIZARD_STEP',
    step,
  };
}
