mache-- Seed subjects and credit packages (run after migrations)

INSERT INTO subjects (name, slug, is_active, is_coming_soon) VALUES
  ('Mathematics', 'mathematics', true, false),
  ('Physics', 'physics', true, false),
  ('Chemistry', 'chemistry', true, false),
  ('German', 'german', false, true),
  ('French', 'french', false, true),
  ('English', 'english', false, true),
  ('Biology', 'biology', false, true),
  ('Economics', 'economics', false, true),
  ('History', 'history', false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO credit_packages (slug, name, credits, price_chf, is_active, is_subscription) VALUES
  ('single', 'Single Lesson', 1, 70, true, false),
  ('pack5', '5 Lesson Package', 5, 325, true, false),
  ('pack10', '10 Lesson Package', 10, 620, true, false),
  ('platform', 'Platform Access', 0, 50, true, true)
ON CONFLICT (slug) DO NOTHING;
