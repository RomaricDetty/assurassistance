import React from 'react';
import { useI18n } from '../../i18n';

/**
 * Affiche un en-tête de page standard avec fil d'Ariane.
 */
export const PageHeader = ({ title, breadcrumbLabel }) => {
    const { t } = useI18n();

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                    <h4 className="page-title">{title}</h4>
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><a href="/">{t('common.appName')}</a></li>
                        <li className="breadcrumb-item active">{breadcrumbLabel || title}</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
