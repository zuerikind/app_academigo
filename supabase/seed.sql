-- Seed subjects and credit packages (run after migrations)

INSERT INTO subjects (name, slug, is_active, is_coming_soon) VALUES
  ('Mathematics', 'mathematics', true, false),
  ('Physics', 'physics', true, false),
  ('Chemistry', 'chemistry', true, false),
  ('German', 'german', false, true),
  ('French', 'french', false, true),
  ('Italian', 'italian', false, true),
  ('English', 'english', false, true),
  ('Spanish', 'spanish', false, true),
  ('Latin', 'latin', false, true),
  ('Greek', 'greek', false, true),
  ('Applied Mathematics', 'applied-mathematics', false, true),
  ('Computer Science', 'computer-science', false, true),
  ('Biology', 'biology', false, true),
  ('History', 'history', false, true),
  ('Geography', 'geography', false, true),
  ('Economics', 'economics', false, true),
  ('Philosophy', 'philosophy', false, true),
  ('Pedagogy and Psychology', 'pedagogy-psychology', false, true),
  ('Religious Studies', 'religious-studies', false, true),
  ('Visual Arts', 'visual-arts', false, true),
  ('Music', 'music', false, true),
  ('Sports', 'sports', false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO credit_packages (slug, name, credits, price_chf, is_active, is_subscription) VALUES
  ('starter',    'Academigo Starter',    1,  89,  true, false),
  ('focus',      'Academigo Focus',      5,  425, true, false),
  ('excellence', 'Academigo Excellence', 10, 790, true, false)
ON CONFLICT (slug) DO UPDATE SET
  name           = EXCLUDED.name,
  credits        = EXCLUDED.credits,
  price_chf      = EXCLUDED.price_chf,
  is_active      = EXCLUDED.is_active,
  is_subscription = EXCLUDED.is_subscription;
