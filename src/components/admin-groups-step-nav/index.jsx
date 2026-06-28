import React from 'react';
import './step-nav.css';

/**
 * Stepper visuel pour le parcours partenaire → groupe → cartes → agent.
 */
export const AdminGroupsStepNav = ({ steps, activeStep, onChange, ariaLabel }) => {
    const activeIndex = steps.findIndex((s) => s.id === activeStep);

    return (
        <nav className="admin-step-nav" aria-label={ariaLabel}>
            <ol className="admin-step-nav__list">
                {steps.map((step, index) => {
                    const isActive = activeStep === step.id;
                    const isDone = !isActive && index < activeIndex;
                    const itemClass = [
                        'admin-step-nav__item',
                        isActive ? 'is-active' : '',
                        isDone ? 'is-done' : ''
                    ].filter(Boolean).join(' ');

                    return (
                        <li key={step.id} className={itemClass}>
                            <button
                                type="button"
                                className="admin-step-nav__btn"
                                onClick={() => onChange(step.id)}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <span className="admin-step-nav__circle">{step.number}</span>
                                <span className="admin-step-nav__label">{step.label}</span>
                                {step.count != null && step.count > 0 && (
                                    <span className="admin-step-nav__count">{step.count}</span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
