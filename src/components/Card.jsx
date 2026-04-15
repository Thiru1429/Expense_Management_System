const colorConfig = {
  blue: {
    iconBg:    '#eef2ff',
    iconColor: '#4f46e5',
    border:    '#4f46e5',
    trendPos:  '#16a34a',
    trendNeg:  '#dc2626',
  },
  green: {
    iconBg:    '#f0fdf4',
    iconColor: '#16a34a',
    border:    '#16a34a',
    trendPos:  '#16a34a',
    trendNeg:  '#dc2626',
  },
  red: {
    iconBg:    '#fef2f2',
    iconColor: '#dc2626',
    border:    '#dc2626',
    trendPos:  '#16a34a',
    trendNeg:  '#dc2626',
  },
  yellow: {
    iconBg:    '#fffbeb',
    iconColor: '#d97706',
    border:    '#d97706',
    trendPos:  '#16a34a',
    trendNeg:  '#dc2626',
  },
  purple: {
    iconBg:    '#faf5ff',
    iconColor: '#7c3aed',
    border:    '#7c3aed',
    trendPos:  '#16a34a',
    trendNeg:  '#dc2626',
  },
};

const Card = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const c = colorConfig[color] ?? colorConfig.blue;

  return (
    <div className={`stat-card ${color}`}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '14px',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}
        >
          {title}
        </p>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              background: c.iconBg,
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={17} color={c.iconColor} />
          </div>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.5px',
          lineHeight: 1.15,
        }}
      >
        {value}
      </div>

      {/* Subtitle / trend */}
      {(subtitle || trend !== undefined) && (
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '10px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          {subtitle && (
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{subtitle}</span>
          )}
          {trend !== undefined && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: trend >= 0 ? c.trendPos : c.trendNeg,
                marginLeft: subtitle ? 'auto' : undefined,
              }}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Card;
