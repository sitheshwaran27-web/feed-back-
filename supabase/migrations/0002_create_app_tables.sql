-- 1. Create the classes table
CREATE TABLE public.classes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  period INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.classes IS 'Stores information about different classes or subjects.';

-- 2. Create the timetables table
CREATE TABLE public.timetables (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_class_day_period UNIQUE (day_of_week, class_id)
);
COMMENT ON TABLE public.timetables IS 'Schedules classes for specific days of the week.';

-- 3. Create the feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  admin_response TEXT,
  is_response_seen_by_student BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_class_feedback UNIQUE (student_id, class_id, created_at)
);
COMMENT ON TABLE public.feedback IS 'Stores student feedback for classes.';

-- 4. Enable Row Level Security (RLS) for all new tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the 'classes' table
CREATE POLICY "Allow authenticated users to read classes"
ON public.classes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage classes"
ON public.classes FOR ALL
TO authenticated
USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- 6. Create RLS policies for the 'timetables' table
CREATE POLICY "Allow authenticated users to read timetables"
ON public.timetables FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage timetables"
ON public.timetables FOR ALL
TO authenticated
USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- 7. Create RLS policies for the 'feedback' table
CREATE POLICY "Allow students to view their own feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Allow students to insert their own feedback"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Allow students to update their own seen status"
ON public.feedback FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Allow admins to manage all feedback"
ON public.feedback FOR ALL
TO authenticated
USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- 8. Create a secure view for user profiles (for admins)
CREATE OR REPLACE VIEW public.user_profiles_view AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.is_admin,
  u.email
FROM
  public.profiles p
JOIN
  auth.users u ON p.id = u.id;

-- 9. Create a function for admins to get all user profiles
CREATE OR REPLACE FUNCTION get_all_user_profiles()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RETURN QUERY SELECT * FROM public.user_profiles_view;
  ELSE
    RAISE EXCEPTION 'You must be an admin to access all user profiles.';
  END IF;
END;
$$;

-- 10. Create a function to delete a class and its dependents
CREATE OR REPLACE FUNCTION delete_class_and_dependents(class_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can delete classes.';
  END IF;

  -- Deleting from timetables and feedback will cascade from the classes table
  -- due to ON DELETE CASCADE constraint.
  DELETE FROM public.classes WHERE id = class_id_to_delete;
END;
$$;

-- 11. Create a function to get class feedback stats
CREATE OR REPLACE FUNCTION get_class_feedback_stats()
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  period INT,
  average_rating NUMERIC,
  feedback_count BIGINT,
  rating_counts JSONB
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id AS class_id,
    c.name AS class_name,
    c.period,
    AVG(f.rating) AS average_rating,
    COUNT(f.id) AS feedback_count,
    jsonb_object_agg(
      f.rating::text,
      (SELECT COUNT(*) FROM public.feedback WHERE class_id = c.id AND rating = f.rating)
    ) FILTER (WHERE f.rating IS NOT NULL) AS rating_counts
  FROM
    public.classes c
  LEFT JOIN
    public.feedback f ON c.id = f.class_id
  GROUP BY
    c.id, c.name, c.period
  ORDER BY
    average_rating DESC;
$$;

-- 12. Create a function to get feedback trends over time
CREATE OR REPLACE FUNCTION get_feedback_trends(timeframe_days INT)
RETURNS TABLE (
  date DATE,
  submission_count BIGINT,
  average_rating NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH date_series AS (
    SELECT generate_series(
      (now() - (timeframe_days - 1) * interval '1 day')::date,
      now()::date,
      '1 day'::interval
    )::date AS date
  )
  SELECT
    ds.date,
    COUNT(f.id) AS submission_count,
    AVG(f.rating) AS average_rating
  FROM
    date_series ds
  LEFT JOIN
    public.feedback f ON f.created_at::date = ds.date
  GROUP BY
    ds.date
  ORDER BY
    ds.date;
$$;