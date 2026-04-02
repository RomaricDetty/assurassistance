import React from 'react'
import { useI18n } from '../../i18n';

/**
 * Pied de page global.
 */
export const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="footer text-center text-sm-start d-print-none">
    <div className="container-fluid">
        <div className="row">
            <div className="col-12">
                <div className="card mb-0 rounded-bottom-0">
                    <div className="card-body">
                        <p className="text-muted mb-0">
                            © {t('common.appName')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</footer>
  )
}
