resource "aws_iam_role" "instance" {
  name               = "instance_role"
  path               = "/system/"
  assume_role_policy = data.aws_iam_policy_document.instance_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "instance_read_only_attachment" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/IAMReadOnlyAccess"
}

resource "aws_iam_instance_profile" "instance_profile" {
  name = "instance_profile"         # Name of the instance profile
  role = aws_iam_role.instance.name # Reference the IAM Role created above

  tags = {
    Name = "instance_profile"
  }
}
