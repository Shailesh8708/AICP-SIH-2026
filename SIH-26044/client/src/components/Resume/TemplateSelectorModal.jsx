import React, { useState, useMemo } from 'react'
import {
  X,
  Search,
  Check,
  Sparkles,
  ShieldCheck,
  Layers,
  Eye,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react'
import {
  RESUME_TEMPLATES,
  CATEGORY_LABELS,
  LAYOUT_LABELS,
  filterTemplates
} from '../../data/resumeTemplatesCatalog'

export const TemplateSelectorModal = ({
  isOpen,
  onClose,
  selectedTemplateId = 'shailesh-format',
  onSelectTemplate
}) => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [layout, setLayout] = useState('all')
  const [atsSafeOnly, setAtsSafeOnly] = useState(false)
  const [previewZoomTemplate, setPreviewZoomTemplate] = useState(null)
  const [imageErrorMap, setImageErrorMap] = useState({})

  const filtered = useMemo(() => {
    return filterTemplates({
      search,
      category,
      layout,
      atsSafeOnly,
    })
  }, [search, category, layout, atsSafeOnly])

  if (!isOpen) return null

  const handleImageError = (id) => {
    setImageErrorMap((prev) => ({ ...prev, [id]: true }))
  }

  const handleSelect = (tpl) => {
    onSelectTemplate(tpl)
    onClose()
  }

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="template-modal-header">
          <div className="template-modal-title-group">
            <div className="template-badge-catalog">
              <Sparkles size={14} /> Catalog of 320 Designs
            </div>
            <h2>Select Resume Template</h2>
            <p className="template-modal-subtitle">
              Choose from 319 official LaTeX &amp; Studio designs and Tier-1 placement standards. All templates generate print-ready A4 PDFs.
            </p>
          </div>
          <button className="template-modal-close" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="template-modal-toolbar">
          {/* Search bar */}
          <div className="template-search-box">
            <Search size={16} className="template-search-icon" />
            <input
              type="text"
              placeholder="Search by role, template name, layout, or keyword (e.g. Software, Jake, Deedy, Sidebar)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="template-search-input"
              autoFocus
            />
            {search && (
              <button className="template-search-clear" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills Row */}
          <div className="template-filters-row">
            {/* Category select */}
            <div className="template-select-wrap">
              <span className="template-filter-label">Role Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="template-filter-dropdown"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Layout buttons */}
            <div className="template-layout-buttons">
              {Object.entries(LAYOUT_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`template-pill ${layout === key ? 'active' : ''}`}
                  onClick={() => setLayout(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ATS Safe checkbox */}
            <label className="template-ats-toggle">
              <input
                type="checkbox"
                checked={atsSafeOnly}
                onChange={(e) => setAtsSafeOnly(e.target.checked)}
              />
              <ShieldCheck size={15} color="#16a34a" />
              <span>ATS-Safe Only</span>
            </label>
          </div>
        </div>

        {/* Results count info */}
        <div className="template-results-count">
          Showing <strong>{filtered.length}</strong> of {RESUME_TEMPLATES.length} templates
          {category !== 'all' && <span> in <em>{CATEGORY_LABELS[category]}</em></span>}
          {layout !== 'all' && <span> ({LAYOUT_LABELS[layout]})</span>}
          {atsSafeOnly && <span> · ATS Verified</span>}
        </div>

        {/* Templates Grid */}
        <div className="template-grid-scroll">
          {filtered.length === 0 ? (
            <div className="template-empty-state">
              <Layers size={40} color="#94a3b8" />
              <h3>No templates found matching your search</h3>
              <p>Try clearing filters or search for another role or design style.</p>
              <button
                className="template-reset-btn"
                onClick={() => {
                  setSearch('')
                  setCategory('all')
                  setLayout('all')
                  setAtsSafeOnly(false)
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="template-cards-grid">
              {filtered.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id
                const hasImgError = imageErrorMap[tpl.id]

                return (
                  <div
                    key={tpl.id}
                    className={`template-item-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(tpl)}
                  >
                    {/* Visual Preview Frame */}
                    <div className="template-card-preview">
                      {!hasImgError ? (
                        <img
                          src={tpl.previewImage}
                          alt={tpl.name}
                          loading="lazy"
                          onError={() => handleImageError(tpl.id)}
                          className="template-img"
                        />
                      ) : (
                        /* Styled SVG Mockup Fallback */
                        <div className="template-mockup-fallback" style={{ borderColor: tpl.accentColor || '#cbd5e1' }}>
                          <div
                            className="mock-banner"
                            style={{ backgroundColor: tpl.accentColor || '#2563eb' }}
                          />
                          <div className="mock-body">
                            <div className="mock-line-title" style={{ backgroundColor: tpl.accentColor || '#2563eb' }} />
                            <div className="mock-line-sub" />
                            <div className="mock-section-head" style={{ backgroundColor: tpl.accentColor || '#2563eb' }} />
                            <div className="mock-line-text" />
                            <div className="mock-line-text" />
                            <div className="mock-section-head" style={{ backgroundColor: tpl.accentColor || '#2563eb' }} />
                            <div className="mock-line-text" />
                          </div>
                        </div>
                      )}

                      {/* Badges overlay */}
                      <div className="template-card-badge-overlay">
                        {tpl.atsClass === 'ats-safe' && (
                          <span className="tpl-badge tpl-badge-ats" title="ATS-Friendly single column or structured parser safe">
                            ✓ ATS Safe
                          </span>
                        )}
                        <span className="tpl-badge tpl-badge-layout">
                          {tpl.layout}
                        </span>
                      </div>

                      {/* Quick Zoom Preview Icon */}
                      <button
                        type="button"
                        className="template-zoom-btn"
                        title="View template details & zoom"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewZoomTemplate(tpl)
                        }}
                      >
                        <Eye size={14} />
                      </button>

                      {isSelected && (
                        <div className="template-selected-indicator">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="template-card-info">
                      <div className="template-card-title-row">
                        <strong className="template-card-name">{tpl.name}</strong>
                        <span className="template-engine-badge">{tpl.engine.toUpperCase()}</span>
                      </div>
                      <p className="template-card-desc">{tpl.description}</p>
                      
                      <div className="template-card-footer">
                        <span className="template-density-tag">
                          Level: <strong>{tpl.density}</strong>
                        </span>
                        <button
                          type="button"
                          className={`template-card-select-btn ${isSelected ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelect(tpl)
                          }}
                        >
                          {isSelected ? 'Selected' : 'Use Template'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="template-modal-footer">
          <div className="template-footer-tip">
            💡 Selecting a template will immediately apply its layout and structure to your resume builder.
          </div>
          <button className="template-btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>

      {/* Quick Zoom Modal */}
      {previewZoomTemplate && (
        <div className="template-zoom-overlay" onClick={() => setPreviewZoomTemplate(null)}>
          <div className="template-zoom-card" onClick={(e) => e.stopPropagation()}>
            <div className="template-zoom-header">
              <div>
                <h3>{previewZoomTemplate.name}</h3>
                <span className="template-zoom-id">Template ID: <code>{previewZoomTemplate.id}</code></span>
              </div>
              <button
                className="template-modal-close"
                onClick={() => setPreviewZoomTemplate(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="template-zoom-body">
              <img
                src={previewZoomTemplate.previewImage}
                alt={previewZoomTemplate.name}
                className="template-zoom-img"
              />
              <div className="template-zoom-details">
                <p><strong>Description:</strong> {previewZoomTemplate.description}</p>
                <div className="template-zoom-tags">
                  <span className="tpl-badge tpl-badge-layout">Layout: {previewZoomTemplate.layout}</span>
                  <span className={`tpl-badge ${previewZoomTemplate.atsClass === 'ats-safe' ? 'tpl-badge-ats' : 'tpl-badge-styled'}`}>
                    {previewZoomTemplate.atsClass}
                  </span>
                  <span className="tpl-badge">Engine: {previewZoomTemplate.engine}</span>
                  <span className="tpl-badge">Density: {previewZoomTemplate.density}</span>
                </div>
                <button
                  type="button"
                  className="template-zoom-apply-btn"
                  onClick={() => {
                    handleSelect(previewZoomTemplate)
                    setPreviewZoomTemplate(null)
                  }}
                >
                  <Check size={16} /> Use This Template Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateSelectorModal

