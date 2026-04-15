import { Inbox } from 'lucide-react';

const Table = ({ columns, data, emptyMessage = 'No records found.' }) => {
  return (
    <div className="table-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <Inbox
                      size={38}
                      color="#cbd5e1"
                      style={{ margin: '0 auto 12px', display: 'block' }}
                    />
                    <p style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: 500 }}>
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
