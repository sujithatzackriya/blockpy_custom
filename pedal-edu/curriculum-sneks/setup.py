import setuptools

setuptools.setup(
    name='curriculum_sneks',
    version='1.0.1',
    python_requires='>=3.6',
    author='acbart',
    author_email='acbart@udel.edu',
    description='Pedal Feedback Functions for the Sneks Curriculum',
    keywords='feedback education teaching program analysis tifa cait sandbox pedal grading grader grade',
    packages=['curriculum_sneks'],
    license='Creative Commons Attribution-Noncommercial-Share Alike license',
    long_description=open('README.md').read(),
    install_requires=[],
    url='https://pedal-edu.github.io/pedal',
    classifiers=[
        "Programming Language :: Python :: 3",
        "Intended Audience :: Education",
        "Topic :: Education",
    ]
)
