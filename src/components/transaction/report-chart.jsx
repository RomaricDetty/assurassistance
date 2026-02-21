import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';

export const ReportChart = ({ payinTransactions, onPeriodChange }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('Ce mois-ci');
    const [chartData, setChartData] = useState({
        categories: [],
        amounts: []
    });

    const processTransactionData = (transactions) => {
        if (!transactions || transactions.length === 0) {
            return { categories: [], amounts: [] };
        }

        const groupedByDate = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
            });
            
            if (!acc[date]) {
                acc[date] = 0;
            }
            acc[date] += transaction.amount;
            return acc;
        }, {});

        const categories = Object.keys(groupedByDate).sort((a, b) => {
            return new Date(a) - new Date(b);
        });
        
        const amounts = categories.map(date => {
            const amount = groupedByDate[date];
            return Math.round(amount / 1000); // Convertir en milliers
        });

        return { categories, amounts };
    };

    useEffect(() => {
        if (payinTransactions) {
            const processedData = processTransactionData(payinTransactions);
            setChartData(processedData);
        }
    }, [payinTransactions]);

    const chartOptions = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: {
                show: false
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            },
            zoom: {
                enabled: false
            }
        },
        stroke: {
            curve: 'stepline',
            width: 3,
            colors: ['#10b981']
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: chartData.categories,
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            },
            labels: {
                style: {
                    colors: '#6c757d',
                    fontSize: '12px'
                }
            },
            tooltip: {
                enabled: true // Active le hover sur l'axe X
            }
        },
        yaxis: {
            title: {
                text: 'Montant (FCFA)',
                style: {
                    color: '#6c757d',
                    fontSize: '12px'
                }
            },
            labels: {
                formatter: function (val) {
                    return 'FCFA ' + val + 'k';
                },
                style: {
                    colors: '#6c757d',
                    fontSize: '12px'
                }
            },
            tooltip: {
                enabled: true // Active le hover sur l'axe Y (même si moins utile)
            }
        },
        colors: ['#10b981'],
        tooltip: {
            enabled: true, // Assure le tooltip fonctionne au hover sur la ligne ou le marker
            shared: true, // Active le tooltip partagé pour de meilleurs effets de hover
            intersect: false, // Tooltip à l'intersection ou non
            y: {
                formatter: function (val) {
                    return 'FCFA ' + val + 'k';
                }
            },
            style: {
                fontSize: '12px'
            }
        },
        legend: {
            show: false
        },
        grid: {
            borderColor: '#f1f3f4',
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        },
        markers: {
            size: 5,
            colors: ['#10b981'],
            strokeColors: '#fff',
            strokeWidth: 2,
            hover: {
                size: 8 // Agrandit le marker au survol pour faciliter le hover
            }
        },
        // Permet d'améliorer le "hover" de la map/graph avec plus d'accessibilité
        states: {
            hover: {
                filter: {
                    type: 'darken',
                    value: 0.8
                }
            },
            active: {
                allowMultipleDataPointsSelection: false,
                filter: {
                    type: 'lighten',
                    value: 0.8
                }
            }
        }
    };

    const chartSeries = [
        {
            name: 'Transactions (payin)',
            data: chartData.amounts
        }
    ];

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        
        // Calculer les dates selon la période
        const now = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'Aujourd\'hui':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'La semaine dernière':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'Le mois dernier':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'Cette année':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = now;
                break;
            default: // 'Ce mois-ci'
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
        }

        // Appeler la fonction de callback avec les paramètres de date
        if (onPeriodChange) {
            onPeriodChange({
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            });
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col">
                        <h4 className="card-title">Historique des transactions (payin)</h4>
                    </div>
                    <div className="col-auto">
                        <div className="dropdown">
                            <a
                                href="#"
                                className="btn bt btn-light dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <i className="icofont-calendar fs-5 me-1" /> {selectedPeriod}
                                <i className="las la-angle-down ms-1" />
                            </a>
                            <div className="dropdown-menu dropdown-menu-end">
                                <a
                                    className="dropdown-item"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePeriodChange('Aujourd\'hui');
                                    }}
                                >
                                    Aujourd'hui
                                </a>
                                <a
                                    className="dropdown-item"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePeriodChange('La semaine dernière');
                                    }}
                                >
                                    La semaine dernière
                                </a>
                                <a
                                    className="dropdown-item"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePeriodChange('Le mois dernier');
                                    }}
                                >
                                    Le mois dernier
                                </a>
                                <a
                                    className="dropdown-item"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePeriodChange('Cette année');
                                    }}
                                >
                                    Cette année
                                </a>
                                <a
                                    className="dropdown-item"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePeriodChange('Ce mois-ci');
                                    }}
                                >
                                    Ce mois-ci
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-body pt-0">
                <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="line"
                    height={350}
                />
            </div>
        </div>
    );
};