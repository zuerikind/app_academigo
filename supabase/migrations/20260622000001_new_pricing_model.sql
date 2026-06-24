-- Migrate to premium one-time pricing model (Starter / Focus / Excellence)
-- No more subscriptions; Plus and old Excellence are deactivated.

-- 1. Rename old subscription "excellence" slug to avoid conflict with the new one-time package
UPDATE credit_packages SET slug = 'excellence_v1', is_active = false WHERE slug = 'excellence';

-- 2. Deactivate Plus subscription
UPDATE credit_packages SET is_active = false WHERE slug = 'plus';

-- 3. Rename and reprice the one-time packages
UPDATE credit_packages
  SET slug = 'starter', name = 'Academigo Starter', credits = 1, price_chf = 89
  WHERE slug = 'single';

UPDATE credit_packages
  SET slug = 'focus', name = 'Academigo Focus', credits = 5, price_chf = 425
  WHERE slug = 'pack5';

UPDATE credit_packages
  SET slug = 'excellence', name = 'Academigo Excellence', credits = 10, price_chf = 790, is_subscription = false
  WHERE slug = 'pack10';
