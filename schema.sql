--
-- PostgreSQL database dump
--

\restrict y61nOs9nFL00V1QAgyNCnjSXg6fkdXq3xcnI9gWc41mzVNgk6urItKVws1OwLk0

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: userrole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.userrole AS ENUM (
    'admin',
    'teacher'
);


--
-- Name: check_waitlist_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_waitlist_data() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'waitlisted' THEN
        IF NEW.waitlist_position IS NULL OR NEW.waitlist_date IS NULL THEN
            RAISE EXCEPTION 'Waitlisted enrollments must have waitlist_position and waitlist_date';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    session_date date NOT NULL,
    session_type character varying(10) DEFAULT 'regular'::character varying NOT NULL,
    session_status character varying(10) DEFAULT 'completed'::character varying NOT NULL,
    status character varying(10) DEFAULT 'present'::character varying NOT NULL,
    note text,
    makeup_reason text,
    recorded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT attendance_session_status_check CHECK (((session_status)::text = ANY ((ARRAY['completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT attendance_session_type_check CHECK (((session_type)::text = ANY ((ARRAY['regular'::character varying, 'makeup'::character varying])::text[]))),
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying])::text[])))
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_code character varying(20) NOT NULL,
    class_name character varying(100) NOT NULL,
    teacher_id uuid NOT NULL,
    assistant_teacher_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    room_number character varying(20),
    building character varying(50),
    level character varying(20) NOT NULL,
    curriculum character varying(50),
    textbook character varying(100),
    max_students integer DEFAULT 15 NOT NULL,
    current_enrollment integer DEFAULT 0 NOT NULL,
    semester character varying(20) DEFAULT ''::character varying,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_sessions integer NOT NULL,
    sessions_per_month integer DEFAULT 4 NOT NULL,
    tuition_per_session numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'VND'::character varying NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    description text,
    prerequisites text,
    learning_objectives text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    days_of_week integer[] NOT NULL,
    CONSTRAINT classes_check CHECK ((end_time > start_time)),
    CONSTRAINT classes_check1 CHECK ((current_enrollment <= max_students)),
    CONSTRAINT classes_check2 CHECK ((end_date > start_date)),
    CONSTRAINT classes_current_enrollment_check CHECK ((current_enrollment >= 0)),
    CONSTRAINT classes_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT classes_level_check CHECK (((level)::text = ANY ((ARRAY['primary_1'::character varying, 'primary_2'::character varying, 'primary_3'::character varying, 'primary_4'::character varying, 'primary_5'::character varying, 'secondary_6'::character varying, 'secondary_7'::character varying, 'secondary_8'::character varying, 'secondary_9'::character varying, 'high_10'::character varying, 'high_11'::character varying, 'high_12'::character varying, 'starters'::character varying, 'movers'::character varying, 'flyers'::character varying, 'ket'::character varying, 'pet'::character varying, 'fce'::character varying, 'ielts'::character varying, 'toefl'::character varying, 'sat'::character varying, 'general_english'::character varying])::text[]))),
    CONSTRAINT classes_max_students_check CHECK (((max_students > 0) AND (max_students <= 30))),
    CONSTRAINT classes_sessions_per_month_check CHECK (((sessions_per_month > 0) AND (sessions_per_month <= 20))),
    CONSTRAINT classes_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT classes_total_sessions_check CHECK ((total_sessions > 0)),
    CONSTRAINT classes_tuition_per_session_check CHECK ((tuition_per_session > (0)::numeric))
);


--
-- Name: TABLE classes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.classes IS 'Seeded with 6 classes: 2 IELTS, 1 TOEFL, 3 grade-based';


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    class_id uuid NOT NULL,
    enrollment_date date DEFAULT CURRENT_DATE NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    waitlist_position integer,
    waitlist_date timestamp with time zone,
    drop_date date,
    drop_reason text,
    agreed_tuition_per_session numeric(10,2) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0,
    discount_reason text,
    attendance_rate numeric(5,2) DEFAULT 0,
    average_score numeric(5,2),
    last_test_score numeric(5,2),
    last_test_date date,
    progress_trend character varying(20),
    predicted_final_score numeric(5,2),
    prediction_confidence numeric(5,2),
    prediction_updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT enrollments_agreed_tuition_per_session_check CHECK ((agreed_tuition_per_session > (0)::numeric)),
    CONSTRAINT enrollments_attendance_rate_check CHECK (((attendance_rate >= (0)::numeric) AND (attendance_rate <= (100)::numeric))),
    CONSTRAINT enrollments_average_score_check CHECK (((average_score >= (0)::numeric) AND (average_score <= (100)::numeric))),
    CONSTRAINT enrollments_check CHECK (((drop_date IS NULL) OR (drop_date >= enrollment_date))),
    CONSTRAINT enrollments_discount_percent_check CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric))),
    CONSTRAINT enrollments_last_test_score_check CHECK (((last_test_score >= (0)::numeric) AND (last_test_score <= (100)::numeric))),
    CONSTRAINT enrollments_predicted_final_score_check CHECK (((predicted_final_score >= (0)::numeric) AND (predicted_final_score <= (100)::numeric))),
    CONSTRAINT enrollments_prediction_confidence_check CHECK (((prediction_confidence >= (0)::numeric) AND (prediction_confidence <= (100)::numeric))),
    CONSTRAINT enrollments_progress_trend_check CHECK (((progress_trend)::text = ANY ((ARRAY['improving'::character varying, 'stable'::character varying, 'declining'::character varying, 'insufficient_data'::character varying])::text[]))),
    CONSTRAINT enrollments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'enrolled'::character varying, 'waitlisted'::character varying, 'withdrawn'::character varying])::text[]))),
    CONSTRAINT enrollments_waitlist_position_check CHECK ((waitlist_position > 0))
);


--
-- Name: TABLE enrollments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.enrollments IS 'Seeded with 20 enrollments distributed across 6 classes';


--
-- Name: payment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    amount numeric(12,0) NOT NULL,
    paid_date date,
    due_date date NOT NULL,
    status character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    enrollment_id uuid,
    payment_method character varying(20),
    note text,
    recorded_by uuid,
    CONSTRAINT payment_history_method_check CHECK ((((payment_method)::text = ANY ((ARRAY['cash'::character varying, 'bank_transfer'::character varying])::text[])) OR (payment_method IS NULL))),
    CONSTRAINT payment_history_status_check CHECK (((status)::text = ANY ((ARRAY['paid'::character varying, 'late'::character varying, 'missed'::character varying])::text[])))
);


--
-- Name: session_cancellations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_cancellations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    class_id uuid NOT NULL,
    session_date date NOT NULL,
    reason text,
    message_sent text,
    cancelled_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    full_name character varying(100) NOT NULL,
    date_of_birth date NOT NULL,
    grade_level character varying(20) NOT NULL,
    phone character varying(20),
    email character varying(255),
    parent_name character varying(100) NOT NULL,
    parent_phone character varying(20) NOT NULL,
    parent_email character varying(255),
    parent_zalo character varying(50),
    secondary_contact_name character varying(100),
    secondary_contact_phone character varying(20),
    english_level character varying(20),
    target_exam character varying(50),
    current_school_name character varying(200),
    current_school_type character varying(20),
    payment_cluster character varying(20) DEFAULT 'new_student'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    enrollment_date date DEFAULT CURRENT_DATE NOT NULL,
    withdrawal_date date,
    withdrawal_reason text,
    notes text,
    medical_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    street_address text,
    ward character varying(100),
    province_city character varying(100),
    CONSTRAINT check_reasonable_age CHECK (((date_of_birth >= (CURRENT_DATE - '80 years'::interval)) AND (date_of_birth <= (CURRENT_DATE - '5 years'::interval)))),
    CONSTRAINT check_withdrawal_after_enrollment CHECK (((withdrawal_date IS NULL) OR (withdrawal_date >= enrollment_date))),
    CONSTRAINT students_current_school_type_check CHECK (((current_school_type)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'international'::character varying, 'unknown'::character varying])::text[]))),
    CONSTRAINT students_english_level_check CHECK (((english_level)::text = ANY ((ARRAY['beginner'::character varying, 'elementary'::character varying, 'pre_intermediate'::character varying, 'intermediate'::character varying, 'upper_intermediate'::character varying, 'advanced'::character varying])::text[]))),
    CONSTRAINT students_grade_level_check CHECK (((grade_level)::text = ANY ((ARRAY['primary_1'::character varying, 'primary_2'::character varying, 'primary_3'::character varying, 'primary_4'::character varying, 'primary_5'::character varying, 'secondary_6'::character varying, 'secondary_7'::character varying, 'secondary_8'::character varying, 'secondary_9'::character varying, 'high_10'::character varying, 'high_11'::character varying, 'high_12'::character varying, 'adult'::character varying])::text[]))),
    CONSTRAINT students_payment_cluster_check CHECK (((payment_cluster)::text = ANY ((ARRAY['new_student'::character varying, 'always_on_time'::character varying, 'needs_reminder'::character varying, 'high_risk'::character varying, 'erratic'::character varying])::text[])))
);


--
-- Name: TABLE students; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.students IS 'Seeded with 20 students: 5 primary, 8 secondary, 7 high school';


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    zalo_id character varying(50),
    whatsapp_number character varying(20),
    role character varying(20) DEFAULT 'teacher'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    bio text,
    specializations text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login_at timestamp with time zone,
    CONSTRAINT teachers_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'teacher'::character varying, 'assistant'::character varying])::text[])))
);


--
-- Name: TABLE teachers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.teachers IS 'Seeded with 3 teachers: Thu (admin/mom), Mai (aunt 1), Anh (aunt 2)';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    role public.userrole DEFAULT 'teacher'::public.userrole NOT NULL,
    full_name character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    teacher_id uuid
);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: classes classes_class_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_class_code_key UNIQUE (class_code);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: payment_history payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_pkey PRIMARY KEY (id);


--
-- Name: session_cancellations session_cancellations_class_id_session_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_cancellations
    ADD CONSTRAINT session_cancellations_class_id_session_date_key UNIQUE (class_id, session_date);


--
-- Name: session_cancellations session_cancellations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_cancellations
    ADD CONSTRAINT session_cancellations_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_email_key UNIQUE (email);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_attendance_class_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_class_date ON public.attendance USING btree (class_id, session_date);


--
-- Name: idx_attendance_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_student ON public.attendance USING btree (student_id);


--
-- Name: idx_attendance_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_attendance_unique ON public.attendance USING btree (enrollment_id, session_date);


--
-- Name: idx_classes_semester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_semester ON public.classes USING btree (semester);


--
-- Name: idx_classes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_status ON public.classes USING btree (status);


--
-- Name: idx_classes_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_teacher_id ON public.classes USING btree (teacher_id);


--
-- Name: idx_enrollments_class_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_class_id ON public.enrollments USING btree (class_id);


--
-- Name: idx_enrollments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);


--
-- Name: idx_enrollments_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_student_id ON public.enrollments USING btree (student_id);


--
-- Name: idx_payment_history_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_due_date ON public.payment_history USING btree (due_date);


--
-- Name: idx_payment_history_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_student_id ON public.payment_history USING btree (student_id);


--
-- Name: idx_students_grade_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_grade_level ON public.students USING btree (grade_level);


--
-- Name: idx_students_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_is_active ON public.students USING btree (is_active);


--
-- Name: idx_students_parent_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_parent_phone ON public.students USING btree (parent_phone);


--
-- Name: idx_students_payment_cluster; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_payment_cluster ON public.students USING btree (payment_cluster);


--
-- Name: idx_teachers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teachers_email ON public.teachers USING btree (email);


--
-- Name: idx_teachers_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teachers_role ON public.teachers USING btree (role) WHERE (is_active = true);


--
-- Name: idx_unique_enrolled_enrollment; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unique_enrolled_enrollment ON public.enrollments USING btree (student_id, class_id) WHERE ((status)::text = 'enrolled'::text);


--
-- Name: idx_unique_waitlist_position; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unique_waitlist_position ON public.enrollments USING btree (class_id, waitlist_position) WHERE ((status)::text = 'waitlisted'::text);


--
-- Name: classes update_classes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: enrollments update_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: students update_students_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: teachers update_teachers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: enrollments validate_waitlist_data; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_waitlist_data BEFORE INSERT OR UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.check_waitlist_data();


--
-- Name: attendance attendance_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: classes classes_assistant_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_assistant_teacher_id_fkey FOREIGN KEY (assistant_teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: classes classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: payment_history payment_history_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id);


--
-- Name: payment_history payment_history_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: payment_history payment_history_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: session_cancellations session_cancellations_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_cancellations
    ADD CONSTRAINT session_cancellations_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id);


--
-- Name: session_cancellations session_cancellations_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_cancellations
    ADD CONSTRAINT session_cancellations_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: users users_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);


--
-- PostgreSQL database dump complete
--

\unrestrict y61nOs9nFL00V1QAgyNCnjSXg6fkdXq3xcnI9gWc41mzVNgk6urItKVws1OwLk0

