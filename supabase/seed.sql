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
  ('single', 'Academigo Essentials — Single', 1, 79, true, false),
  ('pack5', 'Academigo Essentials — 5 Pack', 5, 375, true, false),
  ('pack10', 'Academigo Essentials — 10 Pack', 10, 690, true, false),
  ('plus', 'Academigo Plus', 4, 299, true, true),
  ('excellence', 'Academigo Excellence', 8, 549, true, true)
ON CONFLICT (slug) DO NOTHING;
