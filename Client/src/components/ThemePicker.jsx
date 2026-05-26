// export function ThemePicker({ themes, activeThemeId, onChange }) {
//   return (
//     <div className="col">
//       <div className="row">
//         <select
//           className="select"
//           value={activeThemeId ?? ''}
//           onChange={(e) => onChange(e.target.value)}
//         >
//           {themes.map((t) => (
//             <option value={t.id} key={t.id}>
//               {t.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="kpi">
//         <div className="kpiCard">
//           <div className="kpiValue">{themes.length}</div>
//           <div className="kpiLabel">Themes</div>
//         </div>
//         <div className="kpiCard">
//           <div className="kpiValue">Spotify</div>
//           <div className="kpiLabel">Embed player</div>
//         </div>
//       </div>
//     </div>
//   )
// }

// components/ThemePicker.jsx
export function ThemePicker({ themes, activeThemeId, onChange }) {
  return (
    <div className="col">
      <div className="row">
        <select
          className="select"
          value={activeThemeId ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {/* Add default disabled option to prevent state desync */}
          <option value="" disabled>
            Select a theme
          </option>
          {themes.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="kpi">
        <div className="kpiCard">
          <div className="kpiValue">{themes.length}</div>
          <div className="kpiLabel">Themes</div>
        </div>
        <div className="kpiCard">
          <div className="kpiValue">Spotify</div>
          <div className="kpiLabel">Embed player</div>
        </div>
      </div>
    </div>
  )
}

