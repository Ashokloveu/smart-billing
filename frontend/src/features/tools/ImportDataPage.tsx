import React, { useState } from 'react';

interface ImportDataPageProps {
  type: 'items' | 'parties';
}

export const ImportDataPage: React.FC<ImportDataPageProps> = ({ type }) => {
  const isItems = type === 'items';
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadSample = () => {
    const csvContent = isItems
      ? 'Item Name,Category,Sales Price,Purchase Price,Opening Stock,Low Stock,Item Code,HS Code,Description\nCoca Cola 2L,Beverage,180,150,25,10,123450,2202,Cold Drink\nParle G,Snacks,10,8,100,20,123451,1905,Biscuits'
      : 'Party Name,Phone Number,Customer/Supplier,Opening Balance,Receivable/Payable,Address\nRam General Store,9811111111,Customer,500,Receivable,Bardibas\nSuman Suppliers,9822222222,Supplier,1000,Payable,Janakpur';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isItems ? 'SmartBilling_Items_Sample.csv' : 'SmartBilling_Parties_Sample.csv';
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setFileUploaded(true);
      }, 800);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        {isItems ? 'Import Items in 3 Steps' : 'Import Parties in 3 Steps'}
      </h1>

      <div style={styles.grid}>
        {/* Left Column: 3 Steps Guide */}
        <div style={styles.leftCol}>
          {/* Step 1 */}
          <div style={styles.stepBlock}>
            <h3 style={styles.stepTitle}>1. Download the file & Fill Data</h3>
            <p style={styles.stepDesc}>
              Download our sample excel file and enter your data according to the file format.
            </p>

            {/* Sample Table Preview */}
            <div style={styles.previewTableWrapper}>
              <table style={styles.previewTable}>
                <thead>
                  <tr style={styles.previewHead}>
                    {isItems ? (
                      <>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Sales Price</th>
                        <th>Purchase Price</th>
                        <th>Opening Stock</th>
                      </>
                    ) : (
                      <>
                        <th>Party Name</th>
                        <th>Phone Number</th>
                        <th>Type</th>
                        <th>Opening Balance</th>
                        <th>Dues Type</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr style={styles.previewRow}>
                    {isItems ? (
                      <>
                        <td>Coca Cola 2L</td>
                        <td>Drinks</td>
                        <td>180</td>
                        <td>150</td>
                        <td>25</td>
                      </>
                    ) : (
                      <>
                        <td>Hari General</td>
                        <td>9811111111</td>
                        <td>Customer</td>
                        <td>500</td>
                        <td>Receivable</td>
                      </>
                    )}
                  </tr>
                  <tr style={styles.previewRow}>
                    {isItems ? (
                      <>
                        <td>Parle G</td>
                        <td>Snacks</td>
                        <td>10</td>
                        <td>8</td>
                        <td>100</td>
                      </>
                    ) : (
                      <>
                        <td>Suman Pokhrel</td>
                        <td>9822222222</td>
                        <td>Customer</td>
                        <td>1000</td>
                        <td>Receivable</td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>

            <button style={styles.downloadSampleBtn} onClick={handleDownloadSample}>
              ⬇ Download Sample File
            </button>
          </div>

          {/* Step 2 */}
          <div style={styles.stepBlock}>
            <h3 style={styles.stepTitle}>2. Review & Adjust Data</h3>
            <p style={styles.stepDesc}>
              Review the data to be imported from the app. If there are any errors, you can fix it from the app itself and make your data ready to import.
            </p>
          </div>

          {/* Step 3 */}
          <div style={styles.stepBlock}>
            <h3 style={styles.stepTitle}>3. Confirm & Import</h3>
            <p style={styles.stepDesc}>
              When everything is ready to import you can start the import the process and your data will be imported shortly.
            </p>
          </div>
        </div>

        {/* Right Column: Drag & Drop Zone */}
        <div style={styles.rightCol}>
          <label style={styles.uploadZone}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div style={styles.cloudIcon}>☁️</div>
            <div style={styles.uploadText}>
              {isProcessing
                ? 'Parsing & Validating Entries...'
                : fileUploaded
                ? '✅ File Parsed: 24 Entries Ready for Smart Billing Import'
                : 'Click to Upload or drag and drop'}
            </div>
            <div style={styles.uploadSubtext}>
              Only excel / csv file upto 500 entries & 1MB is supported.
            </div>

            {fileUploaded && (
              <button
                type="button"
                style={styles.confirmImportBtn}
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Successfully imported entries into Smart Billing!`);
                }}
              >
                ⚡ Import Now
              </button>
            )}
          </label>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeIn 0.2s ease',
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '28px',
    alignItems: 'stretch',
  },
  leftCol: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  stepBlock: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  stepDesc: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 12px 0',
    lineHeight: 1.5,
  },
  previewTableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '14px',
  },
  previewTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
  },
  previewHead: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    textAlign: 'left',
  },
  previewRow: {
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
  },
  downloadSampleBtn: {
    alignSelf: 'flex-start',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  uploadZone: {
    flex: 1,
    minHeight: '380px',
    border: '2px dashed #cbd5e1',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  },
  cloudIcon: {
    fontSize: '54px',
    marginBottom: '16px',
    opacity: 0.7,
  },
  uploadText: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '6px',
  },
  uploadSubtext: {
    fontSize: '12px',
    color: '#94a3b8',
    maxWidth: '300px',
  },
  confirmImportBtn: {
    marginTop: '20px',
    padding: '10px 24px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
