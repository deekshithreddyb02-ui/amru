UPDATE site_settings 
SET value = jsonb_set(
  value, 
  '{crms,1,token}', 
  '"sid:ee3fcd87c4f067554d85b0375cb53e41f7bdd8dc,1775110829"'
)
WHERE key = 'crm_settings';